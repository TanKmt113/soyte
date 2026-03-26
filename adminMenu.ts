import {
  LayoutDashboard,
  User,
  CalendarDays,
  NotebookText,
  MessageSquare,
  Building2,
  Stethoscope,
  ShieldCheck,
  Lock,
  Settings,
} from "lucide-react";

export type MenuChild = {
  key: string;
  label: string;
  to: string;
};

export type MenuItem = {
  key: string;
  label: string;
  icon: any;
  permission: string;
  to?: string;
  children?: MenuChild[];
};

export const adminMenu: MenuItem[] = [
  {
    key: "posts",
    label: "Quản lý bài viết",
    icon: LayoutDashboard,
    permission: "posts",
    to: "/admin/dashboard",
  },
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: User,
    permission: "users",
    to: "/admin/users",
  },
  {
    key: "smtp",
    label: "Cấu hình SMTP",
    icon: Settings,
    permission: "email_confirm",
    to: "/admin/smtp",
  },
  {
    key: "schedules",
    label: "Quản lý lịch công tác",
    icon: CalendarDays,
    permission: "work_schedule",
    to: "/admin/schedules",
  },
  // {
  //   key: "templates",
  //   label: "Quản lý biểu mẫu",
  //   icon: NotebookText,
  //   permission: "forms",
  //   to: "/admin/templates",
  // },
  // {
  //   key: "feedbacks",
  //   label: "Quản lý phản hồi",
  //   icon: MessageSquare,
  //   permission: "feedback",
  //   children: [
  //     {
  //       key: "feedback-list",
  //       label: "Danh sách phản hồi",
  //       to: "/admin/feedbacks/form",
  //     },
  //     {
  //       key: "feedback-statistics",
  //       label: "Thống kê phản hồi",
  //       to: "/admin/feedbacks/feedback",
  //     },
  //   ],
  // },
  {
    key: "facilities",
    label: "Quản lý CSYT",
    icon: Building2,
    permission: "social_facilities",
    to: "/admin/social-facilities",
  },
  {
    key: "Medicalreflection",
    label: "Phản ánh y tế",
    icon: Stethoscope,
    permission: "reflect",
    children: [
      {
        key: "feedback-list",
        label: "Biểu mẫu",
        to: "/admin/templates/reflect",
      },
      {
        key: "feedback-statistics",
        label: "Danh sách phản hồi",
        to: "/admin/feedbacks/reflect",
      },
      {
        key: "feedback-report",
        label: "Cuộc khảo sát",
        to: "/admin/surveys/reflect",
      },
    ],
  },
  {
    key: "Qualitysupervision",
    label: "Giám sát chất lượng",
    icon: ShieldCheck,
    permission: "evaluate",
    children: [
      {
        key: "feedback-list",
        label: "Biểu mẫu",
        to: "/admin/templates/evaluate",
      },
      {
        key: "feedback-statistics",
        label: "Danh sách phản hồi",
        to: "/admin/feedbacks/evaluate",
      },
      {
        key: "feedback-report",
        label: "Cuộc khảo sát",
        to: "/admin/surveys/evaluate",
      },
    ],
  },
  {
    key: "permissions",
    label: "Quản lý quyền",
    icon: Lock,
    permission: "permissions",
    to: "/admin/permissions",
  },
  {
    key: "Report",
    label: "Báo cáo",
    icon: NotebookText,
    permission: "report",
    children: [
      {
        key: "report-DCBC",
        label: "Phản ánh y tế",
        to: "/admin/report/DCBC",
      },
      {
        key: "report-KSHL",
        label: "Giám sát chất lượng",
        to: "/admin/report/KSHL"
      },
      {
        key: "report-TCT01",
        label: "Phản ánh y tế - Kết quả thực hiện",
        to: "/admin/report/TCT01"
      }
    ],
  },
];
