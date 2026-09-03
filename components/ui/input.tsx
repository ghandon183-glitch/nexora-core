import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`w-full rounded-xl border border-[#d9b06c]/15 bg-[#1e140b]/70 px-4 py-3 text-[#f6efe1] placeholder:text-[#7f715d] backdrop-blur-xl transition-all duration-300 outline-none focus:border-[#d9b06c]/55 focus:ring-2 focus:ring-[#c79a57]/15 ${className}`} {...props} />
));

Input.displayName = "Input";
export default Input;
