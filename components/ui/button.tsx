import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] hover:scale-105 transition-all duration-300 border border-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-red-600 bg-black text-red-500 hover:bg-red-600/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all",
                secondary:
                    "bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-105 transition-all",
                ghost: "hover:bg-red-600/10 hover:text-red-400 text-white/80 hover:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all",
                link: "text-red-500 underline-offset-4 hover:underline hover:drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]",
                savage: "bg-black border-2 border-red-600 text-red-600 uppercase font-black tracking-widest hover:bg-red-600 hover:text-white hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300 transform",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
