import { Bell, Check, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePartnerNotificationStore } from "@/store/partnerNotificationStore";
import { format } from "date-fns";

interface Props {
    wsConnected: boolean;
}

export default function PartnerNotificationBell({ wsConnected }: Props) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
        usePartnerNotificationStore();

    return (
        <div className="flex items-center gap-2">
            {/* Live/Offline indicator */}
            <div
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${wsConnected
                        ? "text-green-700 border-green-400 bg-green-50 dark:bg-green-950"
                        : "text-red-700 border-red-400 bg-red-50 dark:bg-red-950"
                    }`}
            >
                {wsConnected ? (
                    <Wifi className="h-3 w-3" />
                ) : (
                    <WifiOff className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{wsConnected ? "Live" : "Offline"}</span>
            </div>

            {/* Bell dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 sm:h-9 sm:w-9"
                        data-testid="button-partner-notifications"
                    >
                        <Bell className={`h-4 w-4 sm:h-5 sm:w-5 ${unreadCount > 0 ? "text-orange-500" : ""}`} />
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs animate-pulse"
                                data-testid="badge-partner-notification-count"
                            >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80 sm:w-96">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-orange-500" />
                            <h2 className="font-semibold text-sm">Order Notifications</h2>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notification List */}
                    {notifications.length > 0 ? (
                        <ScrollArea className="h-96">
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-l-4 transition-colors ${notification.read
                                                ? "border-l-gray-300 bg-gray-50 dark:bg-slate-900"
                                                : notification.status === "confirmed"
                                                    ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-l-orange-400 bg-orange-50 dark:bg-orange-900/20"
                                            }`}
                                        data-testid={`partner-notification-${notification.id}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-sm font-medium flex-1 break-words">
                                                {notification.message}
                                            </p>
                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="h-5 w-5 p-0 flex-shrink-0"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <Badge
                                                variant={notification.status === "confirmed" ? "default" : "outline"}
                                                className="text-xs"
                                            >
                                                {notification.status === "confirmed" ? "✅ Confirmed" : "🍽️ New Order"}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(notification.timestamp), "HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No order notifications</p>
                            <p className="text-xs mt-1 opacity-70">
                                {wsConnected ? "Listening for new orders..." : "Reconnecting..."}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearNotifications}
                                    className="w-full justify-center text-xs text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Clear all
                                </Button>
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
