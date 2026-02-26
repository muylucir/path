"use client";

import { useEffect, useRef } from "react";

export function AutoSubmitForm({
  action,
  callbackUrl,
}: {
  action: (formData: FormData) => Promise<void>;
  callbackUrl: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
    </form>
  );
}
