import FilterCard from "@/components/rule/FilterCard";
import { Filter } from "@/data/filters/filter";
import { useFilters } from "@/data/filters/filtersSlice";

export default function FiltersPage() {
  const filters = useFilters();

  return <FiltersCards filters={filters} />;
}

function FiltersCards({ filters }: { filters: Filter[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold tracking-tight">Filters</h3>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {filters.map(f => <FilterCard key={f.id} filter={f} />)}
      </div>
    </div>
  );
}
