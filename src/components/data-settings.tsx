import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  canPickDirectory,
  downloadBackup,
  importBackupFile,
  pickDirectory,
  restoreDirectory,
  useVaultUi,
} from "@/lib/vault";

export function DataSettings({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const supported = useVaultUi((s) => s.supported);
  const bound = useVaultUi((s) => s.bound);
  const folderName = useVaultUi((s) => s.folderName);
  const lastWrite = useVaultUi((s) => s.lastWrite);
  const message = useVaultUi((s) => s.message);
  const setStatus = useVaultUi((s) => s.setStatus);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setStatus({ supported: canPickDirectory() });
  }, [open, setStatus]);

  async function bindFolder() {
    setBusy(true);
    try {
      await pickDirectory();
    } catch (error) {
      const text = error instanceof Error ? error.message : "没有完成选择。";
      if (!text.includes("abort") && !text.includes("Abort")) {
        setStatus({ message: text });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onImport(file: File) {
    setBusy(true);
    try {
      await importBackupFile(file);
      setStatus({ message: "已导入备份。" });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "导入失败。",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dialog-panel-lg">
        <DialogTitle>数据与备份</DialogTitle>
        <DialogDescription>
          电脑端会把档案写到你指定的目录；浏览器里可用 Chrome / Edge 绑定文件夹。把这个目录放进
          iCloud、OneDrive 或坚果云，换电脑后再绑定同一位置即可迁移。
        </DialogDescription>

        <section className="mt-5 rounded-xl bg-secondary p-4">
          <h3 className="text-sm font-medium">数据文件夹</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            选择一个本机目录。墨笺会把完整档案写成这个目录里的 mojian.json。也可选网盘同步文件夹。
          </p>
          <p className="mt-2 text-sm">
            {bound
              ? `已绑定「${folderName}」`
              : supported
                ? "尚未绑定"
                : "当前窗口不能选择文件夹（预览或 Safari 常见）。请用导出备份，或在电脑上的 Chrome / Edge 打开。"}
          </p>
          {lastWrite ? (
            <p className="mt-1 text-xs text-muted-foreground">
              最近写入 {new Date(lastWrite).toLocaleString("zh-CN")}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" disabled={busy || !supported} onClick={() => void bindFolder()}>
              {bound ? "更换文件夹" : "选择数据文件夹"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void restoreDirectory()}
            >
              重新读取
            </Button>
          </div>
        </section>

        <section className="mt-4 rounded-xl bg-secondary p-4">
          <h3 className="text-sm font-medium">备份文件</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            导出一份 JSON，拷到 U 盘或网盘；在另一台电脑导入即可恢复笔记和档案。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadBackup}>
              导出备份
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              导入备份
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void onImport(file);
              }}
            />
          </div>
        </section>

        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
