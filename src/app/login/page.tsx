"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlaskConical, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-provider";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginValues) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="relative w-full max-w-4xl min-h-[600px] grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-center items-center p-12 bg-primary text-primary-foreground text-center">
          <FlaskConical className="h-24 w-24 mb-6" />
          <h1 className="text-4xl font-bold">{t("home.title")}</h1>
          <p className="mt-2 text-lg max-w-sm">{t("home.description")}</p>
        </div>

        {/* Right Side - Form */}
        <div className="bg-card text-card-foreground p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center md:hidden mb-8">
              <FlaskConical className="h-12 w-12 text-primary mx-auto mb-4" />
            </div>

            <h2 className="text-3xl font-bold mb-2">
              {t("login.welcome_title")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t("login.description")}
            </p>
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-6"
            >
              <div className="space-y-2 text-left">
                <Label htmlFor="email">{t("login.email_label")}</Label>
                <Input
                  {...loginForm.register("email")}
                  id="email"
                  type="email"
                  placeholder={t("login.email_placeholder")}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">{t("login.password_label")}</Label>
                <div className="relative">
                  <Input
                    {...loginForm.register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="h-12"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember-me" />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("login.remember_me")}
                  </Label>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("login.error_title")}</AlertTitle>
                  <AlertDescription>
                    {t("login.errors.invalid_credentials")}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading && <Loader className="mr-2 h-5 w-5 animate-spin" />}
                {loading ? t("login.signing_in") : t("login.login_button")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
