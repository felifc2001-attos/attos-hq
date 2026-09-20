import { Suspense } from "react";
import { ContentDialogProvider } from "@/components/content/content-dialog";
import { IdeaDialogProvider } from "@/components/ideas/idea-dialog";
import { IssueDialogProvider } from "@/components/issues/issue-dialog";
import { BottomNav } from "@/components/layout/bottom-nav";
import { UnreadBadge } from "@/components/notifications/unread-badge";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { RequestDialogProvider } from "@/components/requests/request-dialog";
import { QuickCreate } from "@/components/layout/quick-create";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CreateDialogProvider } from "@/components/quick-create/create-dialog";
import { TaskDialogProvider } from "@/components/tasks/task-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <ToastProvider>
      <RealtimeProvider>
        <TaskDialogProvider>
          <CreateDialogProvider>
            <IdeaDialogProvider>
              <RequestDialogProvider meId={user.id}>
                <ContentDialogProvider>
                  <IssueDialogProvider>
                    <Sidebar
                      user={user}
                      notificationsBadge={
                        <Suspense fallback={null}>
                          <UnreadBadge />
                        </Suspense>
                      }
                    />
                    <div className="lg:pl-64">
                      <Topbar />
                      <main className="mx-auto w-full max-w-6xl px-4 pb-36 pt-4 sm:px-8 lg:pb-16">
                        {children}
                      </main>
                    </div>
                    <BottomNav />
                    <QuickCreate />
                  </IssueDialogProvider>
                </ContentDialogProvider>
              </RequestDialogProvider>
            </IdeaDialogProvider>
          </CreateDialogProvider>
        </TaskDialogProvider>
      </RealtimeProvider>
    </ToastProvider>
  );
}
