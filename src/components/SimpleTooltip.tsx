import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


export default function SimpleTooltip(props: {
    children: ReactNode,
    content: ReactNode,
}) {
    return (
    <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {props.children}
          </TooltipTrigger>
          <TooltipContent>
            {props.content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
}