import { useState, useEffect } from "react";
import {
    Smartphone,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow,
    Sun,
    Volume2,
    VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface DeviceInfo {
	isMobile: boolean;
	isOnline: boolean;
	batteryLevel: number;
	isCharging: boolean;
	screenWidth: number;
	screenHeight: number;
	orientation: "portrait" | "landscape";
	prefersDarkMode: boolean;
	volumeLevel: number;
	isMuted: boolean;
}

interface MobileFeaturesProps {
	className?: string;
}

export function MobileFeatures({ className }: MobileFeaturesProps) {
	const t = useTranslations("mobile");
	const { toast } = useToast();

	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
		isMobile: false,
		isOnline: navigator.onLine,
		batteryLevel: 100,
		isCharging: false,
		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
		orientation: window.innerHeight > window.innerWidth ? "portrait" : "landscape",
		prefersDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
		volumeLevel: 50,
		isMuted: false,
	});

	const [features, setFeatures] = useState({
		hapticFeedback: true,
		autoRotate: true,
		darkMode: deviceInfo.prefersDarkMode,
		notifications: true,
		location: false,
		camera: false,
		microphone: false,
		vibration: true,
	});

	useEffect(() => {
		const updateDeviceInfo = () => {
			setDeviceInfo((prev) => ({
				...prev,
				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
				orientation: window.innerHeight > window.innerWidth ? "portrait" : "landscape",
			}));
		};

		const updateOnlineStatus = () => {
			setDeviceInfo((prev) => ({
				...prev,
				isOnline: navigator.onLine,
			}));
		};

		const updateBatteryStatus = async () => {
			if ("getBattery" in navigator) {
				try {
					const battery = await (
						navigator as unknown as {
							getBattery: () => Promise<{
								level: number;
								charging: boolean;
								addEventListener: (event: string, handler: () => void) => void;
							}>;
						}
					).getBattery();
					setDeviceInfo((prev) => ({
						...prev,
						batteryLevel: Math.round(battery.level * 100),
						isCharging: battery.charging,
					}));

					battery.addEventListener("levelchange", () => {
						setDeviceInfo((prev) => ({
							...prev,
							batteryLevel: Math.round(battery.level * 100),
						}));
					});

					battery.addEventListener("chargingchange", () => {
						setDeviceInfo((prev) => ({
							...prev,
							isCharging: battery.charging,
						}));
					});
				} catch (_error) {
					console.warn("Battery API not supported");
				}
			}
		};

		const updateOrientation = () => {
			setDeviceInfo((prev) => ({
				...prev,
				orientation: window.innerHeight > window.innerWidth ? "portrait" : "landscape",
			}));
		};

		// Check if mobile
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		setDeviceInfo((prev) => ({ ...prev, isMobile }));

		// Event listeners
		window.addEventListener("resize", updateDeviceInfo);
		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);
		window.addEventListener("orientationchange", updateOrientation);

		updateBatteryStatus();

		return () => {
			window.removeEventListener("resize", updateDeviceInfo);
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
			window.removeEventListener("orientationchange", updateOrientation);
		};
	}, []);

	const requestPermission = async (permission: "geolocation" | "camera" | "microphone") => {
		try {
			let result: PermissionStatus | undefined;
			switch (permission) {
				case "geolocation":
					result = await navigator.permissions.query({ name: "geolocation" });
					break;
				case "camera":
					result = await navigator.permissions.query({ name: "camera" });
					break;
				case "microphone":
					result = await navigator.permissions.query({ name: "microphone" });
					break;
				default:
					break;
			}

			if (result?.state === "granted") {
				setFeatures((prev) => ({ ...prev, [permission]: true }));
				toast({
					title: t("permissionGranted"),
					description: t(`${permission}PermissionGranted`),
				});
			} else if (result?.state === "prompt" && permission === "geolocation") {
				// Request permission
				navigator.geolocation.getCurrentPosition(
					() => {
						setFeatures((prev) => ({ ...prev, location: true }));
						toast({
							title: t("permissionGranted"),
							description: t("locationPermissionGranted"),
						});
					},
					() => {
						toast({
							title: t("permissionDenied"),
							description: t("locationPermissionDenied"),
							variant: "destructive",
						});
					}
				);
			}
		} catch (_error) {
			toast({
				title: t("permissionError"),
				description: t("permissionErrorDescription"),
				variant: "destructive",
			});
		}
	};

	const toggleFeature = (feature: keyof typeof features) => {
		setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));

		if (feature === "hapticFeedback" && !features[feature] && navigator.vibrate) {
			// Test haptic feedback
			navigator.vibrate(100);
		}

		toast({
			title: features[feature] ? t("featureDisabled") : t("featureEnabled"),
			description: t(`${feature}Toggled`),
		});
	};

	const getBatteryIcon = () => {
		if (deviceInfo.isCharging) {
			return <Battery className="h-4 w-4 text-green-500" />;
		}
		if (deviceInfo.batteryLevel < 20) {
			return <BatteryLow className="h-4 w-4 text-red-500" />;
		}
		return <Battery className="h-4 w-4" />;
	};

	if (!deviceInfo.isMobile) {
		return null;
	}

	return (
		<div className={cn("space-y-4", className)}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Smartphone className="h-5 w-5" />
						{t("deviceStatus")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-2">
							{deviceInfo.isOnline ? (
								<Wifi className="h-4 w-4 text-green-500" />
							) : (
								<WifiOff className="h-4 w-4 text-red-500" />
							)}
							<span className="text-sm">
								{deviceInfo.isOnline ? t("online") : t("offline")}
							</span>
						</div>

						<div className="flex items-center gap-2">
							{getBatteryIcon()}
							<span className="text-sm">
								{deviceInfo.batteryLevel}% {deviceInfo.isCharging && t("charging")}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm">
								{deviceInfo.screenWidth}×{deviceInfo.screenHeight}
							</span>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm capitalize">{deviceInfo.orientation}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("mobileFeatures")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Sun className="h-4 w-4" />
								<span className="text-sm">{t("darkMode")}</span>
							</div>
							<Switch
								checked={features.darkMode}
								onCheckedChange={() => toggleFeature("darkMode")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Volume2 className="h-4 w-4" />
								<span className="text-sm">{t("hapticFeedback")}</span>
							</div>
							<Switch
								checked={features.hapticFeedback}
								onCheckedChange={() => toggleFeature("hapticFeedback")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<VolumeX className="h-4 w-4" />
								<span className="text-sm">{t("notifications")}</span>
							</div>
							<Switch
								checked={features.notifications}
								onCheckedChange={() => toggleFeature("notifications")}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-sm">{t("autoRotate")}</span>
							</div>
							<Switch
								checked={features.autoRotate}
								onCheckedChange={() => toggleFeature("autoRotate")}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("permissions")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm">{t("location")}</span>
						<div className="flex items-center gap-2">
							{features.location && <Badge variant="secondary">{t("granted")}</Badge>}
							<Button
								variant="outline"
								size="sm"
								onClick={() => requestPermission("geolocation")}
							>
								{features.location ? t("revoke") : t("request")}
							</Button>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("camera")}</span>
						<div className="flex items-center gap-2">
							{features.camera && <Badge variant="secondary">{t("granted")}</Badge>}
							<Button
								variant="outline"
								size="sm"
								onClick={() => requestPermission("camera")}
							>
								{features.camera ? t("revoke") : t("request")}
							</Button>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm">{t("microphone")}</span>
						<div className="flex items-center gap-2">
							{features.microphone && (
								<Badge variant="secondary">{t("granted")}</Badge>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={() => requestPermission("microphone")}
							>
								{features.microphone ? t("revoke") : t("request")}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Volume2 className="h-5 w-5" />
						{t("volumeControl")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("volume")}</span>
							<span className="text-sm text-muted-foreground">
								{deviceInfo.volumeLevel}%
							</span>
						</div>
						<Slider
							value={[deviceInfo.volumeLevel]}
							onValueChange={([value]) =>
								setDeviceInfo((prev) => ({ ...prev, volumeLevel: value }))
							}
							max={100}
							step={1}
							className="w-full"
						/>
						<div className="flex items-center justify-between">
							<span className="text-sm">{t("muted")}</span>
							<Switch
								checked={deviceInfo.isMuted}
								onCheckedChange={(muted) =>
									setDeviceInfo((prev) => ({ ...prev, isMuted: muted }))
								}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
