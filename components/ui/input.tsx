import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-4
          py-3
          text-white
          placeholder:text-gray-500
          backdrop-blur-xl
          transition-all
          duration-300
          outline-none
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-400/20
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;