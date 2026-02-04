'use client'

import { CatalogOptionTable } from '@/components/admin/catalog/catalog-option-table'

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subjects</h1>
        <p className="text-muted-foreground mt-1">
          Manage subjects. Use Grade-Subject and Strand-Subject Mappings to assign subjects to grades/strands.
        </p>
      </div>
      <CatalogOptionTable
        title="Subjects"
        apiPath="subjects"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'sort_order', label: 'Sort Order', type: 'number' },
        ]}
        valueKey="code"
        labelKey="name"
      />
    </div>
  )
}
