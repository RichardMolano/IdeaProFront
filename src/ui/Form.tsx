import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"border rounded px-3 py-2 w-full " + (props.className || "")}
    />
  );
}
export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={"border rounded px-3 py-2 w-full " + (props.className || "")}
    />
  );
}
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "bg-black text-black rounded px-4 py-2 " + (props.className || "")
      }
    />
  );
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={"border rounded px-3 py-2 w-full " + (props.className || "")}
    />
  );
}
