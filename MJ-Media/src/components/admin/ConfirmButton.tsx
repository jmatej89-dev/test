"use client";

export function ConfirmButton({ children, message, className = "btn btn-danger btn-sm", formId }: { children: React.ReactNode; message: string; className?: string; formId?: string }) {
  return (
    <button
      type="submit"
      form={formId}
      className={className}
      onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
