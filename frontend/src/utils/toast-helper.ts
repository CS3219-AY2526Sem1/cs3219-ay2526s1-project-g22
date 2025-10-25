import { toast } from "sonner";

export const showToast = (message: string, options?: { success?: boolean }) => {
  if (options?.success) {
    toast.success(message, {
      style: {
        background: "#10b981",
        color: "white",
        border: "1px solid #059669",
      },
    });
  } else {
    toast.error(message, {
      style: {
        background: "#ef4444",
        color: "white",
        border: "1px solid #dc2626",
      },
    });
  }
};
