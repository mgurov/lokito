import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Filter } from "@/data/filters/filter"
import { useFilters } from "@/data/filters/filtersSlice"
import { useFilterHitCount, useFilterTotalCount } from "@/data/logData/logDataHooks"

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
    return (
        <Card data-testid="filter-card">
            <CardHeader >
                <div className="space-x-4">
                    <span className="text-sm text-muted-foreground">#{filter.id}</span>
                    <FilterStats filterId={filter.id} />
                </div>
            </CardHeader>
            <CardContent>
                <p data-testid="filter-message-regex">{filter.messageRegex}</p>
            </CardContent>
        </Card>
    )
}

function FilterStats({ filterId }: { filterId: string }) {
    const currentHitCount = useFilterHitCount(filterId)
    const totalHitCount = useFilterTotalCount(filterId)

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
                >
                    <span data-testid="current-hit-count" className="mr-1">{currentHitCount}</span> / <span data-testid="total-hit-count" className="ml-1">{totalHitCount}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>Hits current session / overall</p>
            </TooltipContent>
        </Tooltip>
    )
}