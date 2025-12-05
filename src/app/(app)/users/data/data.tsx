import { FaceIcon, ImageIcon, SunIcon } from "@radix-ui/react-icons";

export const roles = [
  {
    value: "Admin",
    label: "Admin",
    icon: FaceIcon,
  },
  {
    value: "Supervisor",
    label: "Supervisor",
    icon: SunIcon,
  },
  {
    value: "Technician",
    label: "Technician",
    icon: ImageIcon,
  },
];

export const statuses = [
  {
    value: "Active",
    label: "Active",
  },
  {
    value: "Inactive",
    label: "Inactive",
  },
];
