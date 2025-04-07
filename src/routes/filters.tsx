import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Filter } from "@/data/filters/filter"
import { useFilters } from "@/data/filters/filtersSlice"
import { useFilterHitCount } from "@/data/redux/logDataSlice"

export default function FiltersPage() {

    const filters = useFilters()

    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Filters</h3>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {
                    filters.map(f => (
                        <FilterCard key={f.id} filter={f} />
                    ))
                }
            </div>
        </div>
    )
}

function FilterCard({ filter }: { filter: Filter }) {
    const currentHitCount = useFilterHitCount(filter)
    return (
        <Card data-testid="filter-card">
            <CardHeader >
                <div className="space-x-4">
                    <span className="text-sm text-muted-foreground">#{filter.id}</span>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span data-testid="current-hit-count" 
                                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
                                >
                                    {currentHitCount}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Hits current session</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <p data-testid="filter-message-regex">{filter.messageRegex}</p>
            </CardContent>
        </Card>
    )
}