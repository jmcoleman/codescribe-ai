# CodeScribe UI Standards

**Version:** 1.1
**Last Updated:** January 28, 2026
**Purpose:** Establish consistent UI text conventions, button labeling, table patterns, and interaction patterns across the application.

---

## 📋 Table of Contents

1. [Button Labeling Conventions](#button-labeling-conventions)
2. [Action Text Standards](#action-text-standards)
3. [Filter & Search Patterns](#filter--search-patterns)
4. [Table Patterns (BaseTable)](#table-patterns-basetable)
5. [Empty State Patterns](#empty-state-patterns)
6. [Quick Reference](#quick-reference)

---

## 🔘 Button Labeling Conventions

### Industry Standard Pattern

Based on analysis of GitHub, Linear, Stripe, Notion, and other modern applications, we follow this pattern:

#### Primary Action Buttons: "New [Noun]"

Use **"New [Noun]"** for primary action buttons that create new entities.

```jsx
✅ Correct:
<button>
  <Plus className="w-4 h-4" />
  New Project
</button>

<button>
  <Plus className="w-4 h-4" />
  New Invite Code
</button>

<button>
  <Plus className="w-4 h-4" />
  New Trial Program
</button>

❌ Incorrect:
<button>Create Project</button>      // Too formal for button
<button>Add Project</button>         // Only for importing/adding existing items
<button>Create Code</button>         // Inconsistent with pattern
```

**Rationale:**
- **Concise:** Shortest, clearest pattern
- **Industry standard:** Used by GitHub, Linear, Notion
- **User-friendly:** "New" is more approachable than "Create"
- **Consistent:** Same pattern across all creation actions

---

#### Modal Titles: "Create [Noun]"

Use **"Create [Noun]"** or **"Create New [Noun]"** for form/modal headings.

```jsx
✅ Correct:
<h2>Create Invite Code</h2>
<h2>Create New Project</h2>
<h2>Edit Project</h2>

❌ Incorrect:
<h2>New Invite Code</h2>           // Too informal for heading
<h2>Invite Code Creation</h2>      // Too wordy
<h2>Add Invite Code</h2>           // Inconsistent
```

**Rationale:**
- **Formal:** Modal headings should be slightly more formal
- **Clear:** Immediately communicates the purpose
- **Action-oriented:** Uses verb form to indicate active process

---

#### Submit Buttons: "Create [Noun]"

Use **"Create [Noun]"** for submit buttons inside creation forms.

```jsx
✅ Correct:
<button type="submit">Create Project</button>
<button type="submit">Create Invite Code</button>
<button type="submit">Save Changes</button>

❌ Incorrect:
<button type="submit">Submit</button>        // Too generic
<button type="submit">Add</button>           // Ambiguous
<button type="submit">New Project</button>   // "New" is for primary buttons
```

**Rationale:**
- **Explicit:** Clearly states what will happen
- **Action verb:** Uses imperative form
- **Confirmation:** User knows exactly what action they're taking

---

#### Empty State Buttons: "Create First [Noun]"

Use **"Create First [Noun]"** or **"Create your first [noun]"** for encouraging first-time creation.

```jsx
✅ Correct:
<button>
  <Plus className="w-4 h-4" />
  Create First Project
</button>

<button>
  <Plus className="w-4 h-4" />
  Create First Invite Code
</button>

❌ Incorrect:
<button>Create Project</button>       // Same as regular button
<button>New Project</button>          // Missing "First" emphasis
<button>Get Started</button>          // Too vague
```

**Rationale:**
- **Encouraging:** "First" emphasizes beginning, reduces friction
- **Friendly:** More inviting than standard buttons
- **Clear:** Still maintains clarity about the action

---

### Exception: "Add" for Imports/Uploads

Use **"Add"** when bringing in existing items or importing content.

```jsx
✅ Correct (Add = Import/Upload):
<button>Add Code</button>              // Uploading existing code
<button>Add to Team</button>           // Adding existing user
<button>Add Payment Method</button>    // Adding existing card
<button>Import from GitHub</button>    // Alternative explicit form

❌ Incorrect (should use "New"):
<button>Add Project</button>           // Creating new entity
<button>Add User</button>              // Creating new account
```

**Rationale:**
- **Distinction:** "Add" = bringing in, "New" = creating fresh
- **User expectations:** Matches mental model
- **Industry standard:** GitHub uses "Add" for imports, "New" for creation

---

## 📝 Action Text Standards

### Filter Actions

**Clear filters button:** Use slate color (secondary action)

```jsx
✅ Correct:
<button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
  Clear filters
</button>

❌ Incorrect:
<button className="text-purple-600 dark:text-purple-400">Clear filters</button>  // Purple is for primary actions
<button>Reset</button>                                                            // Too generic
<button>Clear All</button>                                                        // Ambiguous
```

**Rationale:**
- **Visual hierarchy:** Slate = secondary action, purple = primary action
- **Consistency:** All filter clears use same pattern
- **Clarity:** "Clear filters" is explicit

---

### Refresh Actions

**Refresh button:** Icon-only in table header, top-right position

```jsx
✅ Correct:
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  aria-label="Refresh data"
>
  <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
</button>

❌ Incorrect:
<button>Refresh</button>               // Don't use text label
<button>Reload</button>                 // Different semantic meaning
<button>Update</button>                 // Ambiguous
```

**Rationale:**
- **Industry standard:** Icon-only refresh buttons in table headers
- **Clean UI:** Reduces clutter, universally recognized icon
- **Accessibility:** aria-label provides context
- **Position:** Top-right signals secondary utility action

---

## 🔍 Filter & Search Patterns

### Filter Bar Structure

Use the `FilterBar` component with consistent styling:

```jsx
✅ Correct:
<FilterBar
  hasActiveFilters={searchQuery || tierFilter !== 'all'}
  onClearFilters={() => {
    setSearchQuery('');
    setTierFilter('all');
  }}
>
  {/* Search input */}
  <input
    type="text"
    placeholder="Search users..."
    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg..."
    style={{ width: '200px' }}
  />

  {/* Filter dropdowns */}
  <Select
    value={tierFilter}
    onChange={setTierFilter}
    placeholder="All Tiers"
    options={tierOptions}
    ariaLabel="Filter by tier"
  />
</FilterBar>
```

**Pattern requirements:**
1. **Filter icon + "Filters:" label** at the start
2. **Search inputs** before dropdowns (left-to-right reading order)
3. **Clear button** shows only when filters are active
4. **Consistent sizing:** Select uses default `size="normal"` (not small)
5. **Search width:** Fixed 200px for consistent alignment

---

## 📊 Table Patterns (BaseTable)

### When to Use BaseTable Headers

The `BaseTable` component supports optional built-in headers with title, description, and refresh functionality. Use these props for consistent table presentation across admin pages.

**Use BaseTable header when:**
- Table has its own data source (separate from page stats)
- Refresh should update only table data (not full page)
- Table title provides context beyond page title

**Don't use BaseTable header when:**
- Table is the only content on page
- Page header already provides sufficient context
- Custom header layout is needed (use custom wrapper)

---

### BaseTable Header Structure

```jsx
✅ Correct:
<BaseTable
  title="Users"
  description={`${pagination.total} total users`}
  onRefresh={() => fetchUsers(pagination.page, true)}
  data={users}
  columns={columns}
  sorting={sorting}
  onSortingChange={handleSortingChange}
  pagination={pagination}
  onPageChange={handlePageChange}
  isLoading={loading}
  isRefreshing={isRefreshing}
  emptyState={{...}}
/>

❌ Incorrect:
<BaseTable
  title="Users Table"                    // Redundant "Table" suffix
  description="All system users"         // Not dynamic/contextual
  onRefresh={handleRefreshFullPage}      // Should only refresh table data
  data={users}
  columns={columns}
/>
```

**Structure:**
```
┌─────────────────────────────────────────────┐
│  Title                        [Refresh]     │  ← Table Header (optional)
│  Description (X total items)                │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  [Sort] Column 1  │ [Sort] Column 2  │ ... │  ← Table Content
│  Data row 1       │ Data              │     │
│  Data row 2       │ Data              │     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Showing 1 to 20 of 100        [1] 2 3 [→] │  ← Pagination
└─────────────────────────────────────────────┘
```

---

### Refresh Button Pattern

**Industry Standard:** Icon-only button, top-right of table header

```jsx
✅ Correct (handled by BaseTable):
<BaseTable
  onRefresh={() => fetchTableData(pagination.page, true)}
  isRefreshing={isRefreshing}
  // BaseTable renders:
  // <RefreshCw className="w-5 h-5 animate-spin" /> when refreshing
/>

✅ Correct (custom table headers):
<button
  onClick={() => fetchData(pagination.page, false)}
  disabled={isRefreshing}
  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  aria-label="Refresh data"
>
  <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
</button>

❌ Incorrect:
<button onClick={handleRefresh}>
  <RefreshCw />
  Refresh                          // Don't use text label
</button>

<button onClick={handleRefresh}>
  Refresh                          // Icon is required
</button>
```

**Position:** Always top-right of table header, next to title/description

**Behavior:**
- **Sets `isRefreshing` state** (not full `loading`)
- **Applies opacity to table** during refresh
- **Updates data in place** without full reload
- **Smooth user experience** - KPIs update automatically

---

### Table vs Page-Level Actions

Distinguish between actions that affect the table vs the entire page.

**Table-level (in BaseTable header or near table):**
- ✅ Refresh data (icon-only)
- ✅ Export table data
- ✅ Column visibility toggles

**Page-level (in page header, above table):**
- ✅ Primary creation actions ("New Project", "New Invite Code")
- ✅ Page navigation ("Back to Admin")
- ✅ Bulk operations affecting page state

```jsx
✅ Correct Pattern:
<PageLayout>
  {/* Page Header - Primary Actions */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1>User Management</h1>
      <p>Manage users, roles, and accounts</p>
    </div>
    <button>
      <Plus /> New User           {/* Page-level action */}
    </button>
  </div>

  {/* Filters (separate from table) */}
  <FilterBar hasActiveFilters={...} onClearFilters={...}>
    {/* Filter inputs */}
  </FilterBar>

  {/* Table - Data Display + Refresh */}
  <BaseTable
    title="Users"
    description={`${total} total users`}
    onRefresh={fetchUsers}       {/* Table-level action */}
    data={users}
    columns={columns}
  />
</PageLayout>

❌ Incorrect:
<BaseTable
  title="Users"
  onRefresh={fetchUsers}
  // Don't put "New User" button in table header
  // Don't put filters in table header
  // Don't put page navigation in table header
/>
```

---

### BaseTable Header Props

**Required for header:**
- `title` (string) - Table name (e.g., "Users", "Trials", "Invite Codes")
- `description` (string) - Dynamic count (e.g., "150 total users")

**Optional:**
- `onRefresh` (function) - Refresh handler, shows icon-only button when provided
- `isRefreshing` (boolean) - Shows spin animation on refresh icon

**Example:**
```jsx
<BaseTable
  // Header props
  title="Recent Generations"
  description={`${pagination.total} total generations`}
  onRefresh={() => fetchGenerations(pagination.page, false)}

  // Table props
  data={generations}
  columns={columns}
  sorting={sorting}
  onSortingChange={setSorting}
  pagination={pagination}
  onPageChange={handlePageChange}

  // State props
  isLoading={loading}
  isRefreshing={isRefreshing}

  // Empty state
  emptyState={{
    icon: FileText,
    title: 'No generations yet',
    description: 'Document generations will appear here.'
  }}
/>
```

---

### Refresh Implementation Best Practices

**1. Separate Loading States:**
```jsx
const [loading, setLoading] = useState(true);      // Initial load
const [isRefreshing, setIsRefreshing] = useState(false);  // Subsequent refreshes

const fetchData = async (page = 1, isInitialLoad = false) => {
  if (isInitialLoad) {
    setLoading(true);              // Full skeleton/spinner
  } else {
    setIsRefreshing(true);          // Subtle opacity effect
  }

  try {
    const data = await api.fetchData();
    setData(data);
  } finally {
    setLoading(false);
    setIsRefreshing(false);
  }
};
```

**2. Refresh Should Update Data Only:**
```jsx
✅ Correct:
const handleRefresh = () => {
  fetchTableData(currentPage, false);  // Just data
};

❌ Incorrect:
const handleRefresh = () => {
  fetchTableData(1, true);             // Resets to page 1 (bad UX)
  fetchStats();                        // Full page reload (too heavy)
  setFilters({});                      // Clears filters (unexpected)
};
```

**3. KPIs Update Automatically:**
```jsx
// KPIs computed from data - no separate fetch needed
<div className="stats">
  <div>Total: {codes.length}</div>
  <div>Active: {codes.filter(c => c.status === 'active').length}</div>
</div>

// Refresh updates codes array, KPIs update automatically
<BaseTable
  onRefresh={() => fetchCodes(pagination.page, false)}
  data={codes}
/>
```

---

### Custom Table Headers

For tables that need custom header layouts, use plain markup instead of BaseTable header props:

```jsx
<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
  {/* Custom Header */}
  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Custom Title
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Custom description
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Multiple action buttons */}
        <button onClick={handleRefresh} aria-label="Refresh data">
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>

    {/* Filters embedded in header */}
    <FilterBarContent hasActiveFilters={...} onClearFilters={...}>
      {/* Filter inputs */}
    </FilterBarContent>
  </div>

  {/* Table content (without BaseTable wrapper) */}
  <div className="overflow-x-auto">
    <table>...</table>
  </div>
</div>
```

---

## 🎭 Empty State Patterns

### Empty State Components

```jsx
✅ Correct:
emptyState={{
  icon: Users,
  title: hasFilters ? 'No matching items' : 'No items yet',
  description: hasFilters
    ? 'Try adjusting your filters'
    : 'Create your first item to get started.',
  action: !hasFilters && (
    <button>
      <Plus className="w-4 h-4" />
      Create First Item
    </button>
  )
}}

❌ Incorrect:
emptyState={{
  title: 'Nothing here',              // Too casual
  description: 'Add something',        // Not helpful
  action: <button>Get Started</button> // Too vague
}}
```

**Guidelines:**
- **Icon:** Use relevant icon (Users, FileText, Calendar, etc.)
- **Title:** Clear, action-oriented ("No projects yet" vs "Empty")
- **Description:** Helpful, contextual guidance
- **Action:** Only show if no filters active (use clear filters when filtered)
- **Friendly tone:** Encouraging, not intimidating

---

## ⚡ Quick Reference

### Button Text by Context

| Context | Text Pattern | Example |
|---------|-------------|---------|
| **Primary button** | New [Noun] | "New Project" |
| **Modal title** | Create [Noun] | "Create Invite Code" |
| **Submit button** | Create [Noun] | "Create Project" |
| **Empty state** | Create First [Noun] | "Create First Project" |
| **Import/Upload** | Add [Noun] | "Add Code" |
| **Clear filters** | Clear filters | "Clear filters" |
| **Refresh** | (icon only) | `<RefreshCw />` |

### Color Usage

| Action Type | Color | Usage |
|------------|-------|-------|
| **Primary actions** | Purple 600 | Create, New, Generate, Save |
| **Secondary actions** | Slate 600 | Clear filters, Cancel |
| **Destructive actions** | Red 600 | Delete, Remove, Revoke |
| **Success actions** | Green 600 | Approve, Activate, Confirm |

### Size Standards

| Component | Size | Reasoning |
|-----------|------|-----------|
| **Select dropdowns** | `size="normal"` (default) | Matches rest of app inputs |
| **Search inputs** | `py-2 text-sm` | Matches Select height |
| **Filter bar** | Fixed 200px width for search | Consistent alignment |
| **Icons in buttons** | `w-4 h-4` | Standard button icon size |
| **Refresh icons** | `w-5 h-5` | Slightly larger for standalone |

### BaseTable Patterns

| Element | Pattern | Example |
|---------|---------|---------|
| **Title** | Noun only (no "Table" suffix) | "Users" (not "Users Table") |
| **Description** | Dynamic count | `${total} total users` |
| **Refresh** | Icon-only, top-right | `onRefresh={() => fetch(...)}` |
| **Filters** | Outside table (FilterBar) | Above table, not in header |
| **Primary actions** | Page header, not table header | "New User" in page header |
| **Loading states** | `loading` (initial), `isRefreshing` (refresh) | Separate states for UX |

---

## 🎯 Implementation Checklist

When creating new UI elements, verify:

**Button Labeling:**
- [ ] Primary buttons use "New [Noun]" pattern
- [ ] Modal titles use "Create [Noun]" pattern
- [ ] Submit buttons use "Create [Noun]" pattern
- [ ] Empty state buttons use "Create First [Noun]" pattern
- [ ] "Add" only used for imports/uploads

**Filters & Search:**
- [ ] "Clear filters" uses slate color
- [ ] Filter bars use FilterBar component
- [ ] Select dropdowns use default size (not small)
- [ ] Search inputs are 200px wide

**Tables (BaseTable):**
- [ ] Table headers use `title` and `description` props
- [ ] Refresh buttons are icon-only (via `onRefresh` prop)
- [ ] Refresh updates only table data (not full page)
- [ ] Use `isRefreshing` for subtle opacity (not `loading`)
- [ ] KPIs are computed from data (update automatically)
- [ ] Filters are outside table (use FilterBar above)
- [ ] Primary actions in page header (not table header)

---

## 📚 Related Documentation

- [BaseTable.jsx](../../client/src/components/BaseTable.jsx) - Table component implementation
- [FilterBar.jsx](../../client/src/components/FilterBar.jsx) - Filter bar component implementation
- [FIGMA-DESIGN-GUIDE.md](FIGMA-DESIGN-GUIDE.md) - Color system and visual design
- [MODAL_DESIGN_STANDARDS.md](MODAL_DESIGN_STANDARDS.md) - Modal UX patterns
- [NAVIGATION-DESIGN-PATTERNS.md](NAVIGATION-DESIGN-PATTERNS.md) - Navigation conventions
- [COLOR-REFERENCE.md](theming/COLOR-REFERENCE.md) - Complete color palette

---

## 🔄 Version History

- **v1.1** (Jan 28, 2026) - Added BaseTable patterns
  - Table header structure (title/description/refresh)
  - Refresh button implementation best practices
  - Table vs page-level actions
  - Custom table header patterns
  - Loading state management
  - Updated quick reference and checklist

- **v1.0** (Jan 28, 2026) - Initial standards document
  - Button labeling conventions
  - Filter/search patterns
  - Empty state patterns
  - Quick reference tables
