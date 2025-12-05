'use client';

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { History, FileDown, PlusCircle, RefreshCw, AlertTriangle } from "lucide-react";
import type { NotificationSetting, NotificationLog } from "@/lib/types";
import { NotificationSettingsDialog } from "./components/notification-settings-dialog";
import { getNotificationLogs } from "@/services/notificationService";
import { getNotificationSettings, updateNotificationSetting, addNotificationSetting, seedNotificationSettings } from "@/services/notificationSettingsService";
import { ExportExcelDialog } from "../equipment/components/export-excel-dialog";
import { NotificationHistoryDialog } from "./components/notification-history-dialog";
import { CreateNotificationTypeDialog } from './components/create-notification-type-dialog';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationSettingCard } from "./components/notification-setting-card";


export default function NotificationsPage() {
    const { t } = useI18n();
    const { toast } = useToast();
    
    const [settings, setSettings] = useState<NotificationSetting[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSetting, setSelectedSetting] = useState<NotificationSetting | null>(null);
    const [modalState, setModalState] = useState({
        isSettingsOpen: false,
        isCreateOpen: false,
        isExportOpen: false,
        isHistoryOpen: false,
    });
    const [needsInitialization, setNeedsInitialization] = useState(false);

    const fetchSettingsAndLogs = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedSettings, currentLogs] = await Promise.all([
                getNotificationSettings(),
                getNotificationLogs(),
            ]);

            if (fetchedSettings.length === 0) {
                setNeedsInitialization(true);
            } else {
                setSettings(fetchedSettings);
                setNeedsInitialization(false);
            }
            setLogs((currentLogs || []) as NotificationLog[]);
        } catch (error) {
            console.error("Failed to fetch notification data:", error);
            toast({
                variant: 'destructive',
                title: 'Error de Carga',
                description: 'No se pudo cargar la configuración de notificaciones.',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchSettingsAndLogs();
    }, [fetchSettingsAndLogs]);

    const handleInitialize = async () => {
        setLoading(true);
        try {
            await seedNotificationSettings();
            toast({
                variant: 'success',
                title: 'Configuración Inicializada',
                description: 'La configuración de notificaciones por defecto ha sido creada.',
            });
            await fetchSettingsAndLogs();
        } catch (error) {
            console.error("Failed to initialize settings:", error);
            toast({
                variant: 'destructive',
                title: 'Error de Inicialización',
                description: 'No se pudo crear la configuración inicial.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConfigureClick = (setting: NotificationSetting) => {
        setSelectedSetting(setting);
        setModalState(prev => ({ ...prev, isSettingsOpen: true }));
    };
    
    const handleCreateNewType = async (data: Omit<NotificationSetting, 'id' | 'type' | 'recipients' | 'isActive' | 'daysBefore'>) => {
        try {
            await addNotificationSetting(data);
            toast({
                variant: 'success',
                title: t('notifications_page.toast.create_success_title'),
                description: t('notifications_page.toast.create_success_desc')
            });
            await fetchSettingsAndLogs();
            setModalState(prev => ({ ...prev, isCreateOpen: false }));
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error al Crear',
                description: error.message || 'No se pudo crear el nuevo tipo de notificación.'
            });
        }
    }

    const handleSaveSettings = async (
        setting: NotificationSetting,
        data: { isActive: boolean; daysBefore: number; recipients: { email: string }[] }
    ) => {
        const updatedSetting: NotificationSetting = { 
            ...setting, 
            ...data, 
            recipients: data.recipients.map(r => r.email) 
        };
        
        await updateNotificationSetting(updatedSetting);
        toast({
            variant: 'success',
            title: t('notification_settings_dialog.toast.success_title'),
            description: t('notification_settings_dialog.toast.success_desc'),
        });
        
        setSettings(prevSettings => 
            prevSettings.map(s => s.id === updatedSetting.id ? updatedSetting : s)
        );

        setModalState(prev => ({ ...prev, isSettingsOpen: false }));
        setSelectedSetting(null);
    };

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex items-center gap-2 pt-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-28 rounded-full" />
                            </div>
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <>
            <PageHeader
                title={t("notifications_page.title")}
                description={t("notifications_page.description")}
                actions={
                    <div className="flex items-center gap-2">
                         <Button variant="outline" onClick={() => setModalState(prev => ({ ...prev, isHistoryOpen: true }))}>
                            <History className="mr-2 h-4 w-4" />
                            {t('notifications_page.history.view_button')}
                        </Button>
                        <Button className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" onClick={() => setModalState(prev => ({ ...prev, isExportOpen: true }))}>
                            <FileDown className="mr-2 h-4 w-4" />
                            {t('equipment_page.export_button')}
                        </Button>
                         <Button onClick={() => setModalState(prev => ({ ...prev, isCreateOpen: true }))}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('notifications_page.add_button')}
                        </Button>
                    </div>
                }
            />
            
            <div className="space-y-4">
                {loading ? (
                    <LoadingSkeleton />
                ) : needsInitialization ? (
                     <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">{t('notifications_page.init_required.title')}</h3>
                        <p className="mb-4 mt-2 text-sm text-muted-foreground">
                            {t('notifications_page.init_required.description')}
                        </p>
                        <Button onClick={handleInitialize}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('notifications_page.init_required.button')}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {settings.map((setting) => (
                           <NotificationSettingCard 
                                key={setting.id}
                                setting={setting}
                                onConfigure={handleConfigureClick}
                           />
                        ))}
                    </div>
                )}
            </div>

            <NotificationSettingsDialog
                isOpen={modalState.isSettingsOpen}
                onClose={() => {
                    setModalState(prev => ({ ...prev, isSettingsOpen: false }));
                    setSelectedSetting(null);
                }}
                onSave={handleSaveSettings}
                setting={selectedSetting}
            />
            
            <CreateNotificationTypeDialog
                isOpen={modalState.isCreateOpen}
                onClose={() => setModalState(prev => ({ ...prev, isCreateOpen: false }))}
                onSave={handleCreateNewType}
            />

            <NotificationHistoryDialog 
                isOpen={modalState.isHistoryOpen}
                onClose={() => setModalState(prev => ({ ...prev, isHistoryOpen: false }))}
                logs={logs}
            />

            <ExportExcelDialog 
                isOpen={modalState.isExportOpen}
                onClose={() => setModalState(prev => ({ ...prev, isExportOpen: false }))}
                exportType="notifications"
                notificationData={logs}
            />
        </>
    );
}
