type FullScreenLoaderProps = {
  open: boolean;
  message?: string;
};

export const FullScreenLoader = ({ open, message }: FullScreenLoaderProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 bg-card border border-border rounded-xl px-6 py-5 shadow-lg">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        {message && <p className="text-sm text-muted-foreground text-center">{message}</p>}
      </div>
    </div>
  );
};
