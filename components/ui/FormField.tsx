import { forwardRef } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, required, hint, error, className = '', children }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[#0A0A0A] mb-1.5">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-[#9C9C9C]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-[#EF4444] font-medium">{error}</p>}
    </div>
  )
}

// Genesis input base — 6px radius, 10px vertical / 14px horizontal padding, 14px font
const inputBase = [
  'w-full px-3.5 py-2.5 border border-[#E8E8EC] rounded-[6px]',
  'bg-[#FFFFFF] text-[#0A0A0A] text-sm',
  'placeholder:text-[#9C9C9C]',
  'transition-colors duration-150',
  'focus:outline-none focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
].join(' ')

const inputError = [
  'w-full px-3.5 py-2.5 border border-[#EF4444] rounded-[6px]',
  'bg-red-50 text-[#0A0A0A] text-sm',
  'placeholder:text-[#9C9C9C]',
  'transition-colors duration-150',
  'focus:outline-none focus:border-[#EF4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]',
].join(' ')

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => (
    <input ref={ref} className={`${hasError ? inputError : inputBase} ${className}`} {...props} />
  )
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, className = '', children, ...props }, ref) => (
    <select ref={ref} className={`${hasError ? inputError : inputBase} ${className}`} {...props}>
      {children}
    </select>
  )
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${hasError ? inputError : inputBase} resize-none ${className}`} {...props} />
  )
)
Textarea.displayName = 'Textarea'
