import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(user?.id);

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:min-h-0 md:bg-transparent md:pb-0">
      <Navbar variant="minimal" title="Notifications" />

      <div className="space-y-6 p-4 pt-6 md:p-6 md:pt-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Notification Center</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">Activity updates that matter</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track campaign applications, hiring decisions, bookings, and collaboration changes in one place.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-2xl border-slate-200"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} className="mr-2" />
            Mark all as read
          </Button>
        </div>
      </section>

      {notifications.length === 0 ? (
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">No notifications yet</h2>
              <p className="mt-1 text-sm text-slate-500">New campaign and collaboration updates will show up here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={async () => {
                if (!notification.read) {
                  await markAsRead(notification.id);
                }
                if (notification.action_url) {
                  navigate(notification.action_url);
                }
              }}
              className={`w-full rounded-3xl border p-4 text-left shadow-sm transition-all ${
                notification.read
                  ? "border-slate-200 bg-white hover:border-slate-300"
                  : "border-teal-200 bg-teal-50/60 hover:border-teal-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.read ? "bg-slate-200" : "bg-teal-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                      {notification.body && <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                      {notification.action_url && <ChevronRight size={14} />}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {notification.type.replace(/_/g, " ")}
                    </span>
                    {!notification.read && (
                      <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Notifications;
