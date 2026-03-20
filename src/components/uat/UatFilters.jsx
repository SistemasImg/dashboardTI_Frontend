import Label from '@/widgets/forms/label';
import Select from '@/widgets/forms/select';
import Option from '@/widgets/forms/option';
import Input from '@/widgets/forms/input';
import { MdSearch } from 'react-icons/md';

export default function UatFilters({
  filterConfigs,
  selectedTable,
  filterValues,
  filterSetters,
  products,
  domains,
  users,
  handleSearch,
  clearFilters,
  hasActiveFilters,
}) {
  return (
    <div className="mb-4 flex flex-col flex-wrap items-end gap-2 p-2 sm:flex-row sm:p-8">
      {filterConfigs[selectedTable].map((filter) => {
        if (filter.type === 'select') {
          let options = [];
          if (filter.key === 'filterProduct') options = products;
          else if (filter.key === 'filterDomain') options = domains;
          else if (filter.key === 'filterTesterId') options = users;
          return (
            <div key={filter.key}>
              <Label>{filter.label}</Label>
              <Select
                value={filterValues[filter.key]}
                onChange={(e) => filterSetters[filter.key](e.target.value)}
              >
                <Option value="" hidden disabled>
                  All
                </Option>
                {Array.isArray(options) &&
                  options.map((opt) => (
                    <Option key={opt.id} value={opt.id}>
                      {opt.name || opt.username}
                    </Option>
                  ))}
              </Select>
            </div>
          );
        }
        return (
          <div key={filter.key}>
            <Label>{filter.label}</Label>
            <Input
              type={filter.type}
              value={filterValues[filter.key]}
              onChange={(e) => filterSetters[filter.key](e.target.value)}
              placeholder={filter.label}
            />
          </div>
        );
      })}
      <button
        type="button"
        className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-2 text-white"
        onClick={handleSearch}
        title="Search"
      >
        <MdSearch /> Search
      </button>
      {hasActiveFilters && (
        <button
          type="button"
          className="flex items-center gap-1 rounded bg-gray-300 px-3 py-2 text-gray-800"
          onClick={clearFilters}
          title="Clear filters"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
