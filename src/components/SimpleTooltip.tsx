import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';


export default function SimpleTooltip(props: {
    children: ReactNode,
    content: ReactNode,
}) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {props.children}
        </TooltipTrigger>
        <TooltipContent>
          {props.content}
        </TooltipContent>
      </Tooltip>
    )
}