"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { getUsers } from "@/services/userService";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Map, MapPin, ZoomIn, ZoomOut, Redo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Position = {
  coordinates: [number, number];
  zoom: number;
};

export default function MapPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const userList = await getUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const usersWithLocation = useMemo(() => {
    return users
      .filter(
        (u) =>
          u.location?.latitude &&
          u.location?.longitude &&
          u.status !== "Inactive"
      )
      .sort(
        (a, b) =>
          parseISO(b.lastLogin || "0").getTime() -
          parseISO(a.lastLogin || "0").getTime()
      );
  }, [users]);

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleMoveEnd(position: Position) {
    setPosition(position);
  }

  function handleUserClick(user: User) {
    if (user.location) {
      setPosition({
        coordinates: [user.location.longitude, user.location.latitude],
        zoom: 4,
      });
    }
  }

  const handleResetView = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  return (
    <>
      <PageHeader
        title={t("map_page.title")}
        description={t("map_page.description")}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] w-full p-0 overflow-hidden relative border-none shadow-xl">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <>
                <ComposableMap
                  projectionConfig={{ scale: 205 }}
                  style={{ width: "100%", height: "100%" }}
                  projection="geoMercator"
                >
                  <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={handleMoveEnd}
                    style={{
                      transition: "all 750ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="hsl(var(--muted))"
                            stroke="hsl(var(--background))"
                            style={{
                              default: { outline: "none" },
                              hover: {
                                outline: "none",
                                fill: "hsl(var(--accent))",
                              },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                    <AnimatePresence>
                      {usersWithLocation.map((user) => (
                        <Marker
                          key={user.id}
                          coordinates={[
                            user.location!.longitude,
                            user.location!.latitude,
                          ]}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.g
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  whileHover={{ scale: 1.5, zIndex: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                  }}
                                  onClick={() => handleUserClick(user)}
                                >
                                  <circle
                                    r={8 / position.zoom}
                                    fill="hsl(var(--primary))"
                                    stroke="#fff"
                                    strokeWidth={2 / position.zoom}
                                    className="cursor-pointer"
                                  />
                                  <circle
                                    r={12 / position.zoom}
                                    fill="hsl(var(--primary) / 0.3)"
                                    className="cursor-pointer animate-pulse"
                                  />
                                </motion.g>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={user.avatar}
                                      alt={user.name}
                                    />
                                    <AvatarFallback>
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.location?.city},{" "}
                                      {user.location?.country}
                                    </p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Marker>
                      ))}
                    </AnimatePresence>
                  </ZoomableGroup>
                </ComposableMap>
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <Button size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleResetView}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{t("map_page.users_table")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("map_page.columns.user")}</TableHead>
                    <TableHead>{t("map_page.columns.last_login")}</TableHead>
                    <TableHead>{t("map_page.columns.location")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : usersWithLocation.length > 0 ? (
                    usersWithLocation.map((user) => (
                      <TableRow
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.lastLogin
                            ? formatDistanceToNow(parseISO(user.lastLogin), {
                                addSuffix: true,
                                locale: locale === "es" ? es : undefined,
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {user.location?.city
                            ? `${user.location.city}, ${user.location.country}`
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Map className="h-10 w-10 text-muted-foreground/30" />
                          <span className="text-muted-foreground">
                            {t("map_page.no_location")}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
