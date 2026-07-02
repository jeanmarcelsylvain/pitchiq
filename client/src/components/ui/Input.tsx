import { cn } from '@/lib/utils'
import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

/* Input system — visible labels (never placeholder-only), animated focus
   border, error/success/helper states with messages below the field. */

interface FieldChrome {
  label?: string
  helper?: string
  error?: string
  success?: string
}

const fieldBase = cn(
  'w-full rounded-md border bg-slate-900/80 px-3.5 py-2.5 text-sm text-white',
  'placeholder:text-slate-600 outline-none transition-all duration-200',
  'border-slate-700 hover:border-slate-600',
  'focus:border-pitch-500 focus:shadow-[0_0_0_3px_rgba(255,90,60,0.15)]',
  'disabled:opacity-45 disabled:cursor-not-allowed'
)

function FieldWrap({ id, label, helper, error, success, children }: FieldChrome & { id: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={12} aria-hidden /> {error}
        </p>
      )}
      {!error && success && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={12} aria-hidden /> {success}
        </p>
      )}
      {!error && !success && helper && (
        <p className="mt-1.5 text-xs text-slate-500">{helper}</p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldChrome>(
  ({ label, helper, error, success, className, id: idProp, ...props }, ref) => {
    const autoId = useId()
    const id = idProp ?? autoId
    return (
      <FieldWrap id={id} label={label} helper={helper} error={error} success={success}>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          className={cn(
            fieldBase,
            error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(255,77,94,0.15)]',
            success && 'border-emerald-500/50',
            className
          )}
          {...props}
        />
      </FieldWrap>
    )
  }
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChrome>(
  ({ label, helper, error, success, className, id: idProp, ...props }, ref) => {
    const autoId = useId()
    const id = idProp ?? autoId
    return (
      <FieldWrap id={id} label={label} helper={helper} error={error} success={success}>
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          className={cn(
            fieldBase, 'resize-none',
            error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(255,77,94,0.15)]',
            success && 'border-emerald-500/50',
            className
          )}
          {...props}
        />
      </FieldWrap>
    )
  }
)
Textarea.displayName = 'Textarea'
