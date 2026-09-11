"use client";
import { useState, useMemo } from 'react';

interface FieldInfo {
  path: string;
  label: string;
  dataType: string;
  example?: any;
  unit?: string;
}

interface FieldExplorerProps {
  data: any;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  title?: string;
}

// ════════════════════════════════════════════════════════
//  FLATTEN OBJECT - Extrai todos os campos de um objeto
// ═══════════════════════════════════════════════════════
function flattenObject(obj: any, prefix = '', result: FieldInfo[] = []): FieldInfo[] {
  if (obj === null || obj === undefined) return result;

  if (typeof obj === 'object' && !Array.isArray(obj)) {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const label = key.replace(/([A-Z])/g, ' $1').trim();

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else if (Array.isArray(value)) {
        // Trata arrays: adiciona o array inteiro E seus itens
        result.push({
          path: newKey,
          label: `${label} (array)`,
          dataType: 'array',
          example: value,
        });
        value.forEach((item, index) => {
          const itemKey = `${newKey}[${index}]`;
          if (typeof item === 'object' && item !== null) {
            flattenObject(item, itemKey, result);
          } else {
            result.push({
              path: itemKey,
              label: `${label}[${index}]`,
              dataType: typeof item,
              example: item,
            });
          }
        });
      } else {
        result.push({
          path: newKey,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          dataType: typeof value,
          example: value,
          unit: extractUnitFromKey(key),
        });
      }
    });
  } else {
    // Valor primitivo na raiz
    result.push({
      path: prefix || 'value',
      label: prefix ? prefix : 'Value',
      dataType: typeof obj,
      example: obj,
    });
  }

  return result;
}

function extractUnitFromKey(key: string): string | undefined {
  const unitMap: Record<string, string> = {
    temp: '°C', temperature: '°C', celsius: '°C',
    pressure: 'bar', press: 'bar',
    speed: 'km/h', velocity: 'km/h',
    rpm: 'rpm', voltage: 'V', volt: 'V',
    current: 'A', amp: 'A',
    distance: 'm', dist: 'm',
    time: 's', duration: 's',
  };
  const lowerKey = key.toLowerCase();
  for (const [k, unit] of Object.entries(unitMap)) {
    if (lowerKey.includes(k)) return unit;
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════
//  GROUP BY HIERARCHY - Agrupa campos em árvore
// ═══════════════════════════════════════════════════════
interface TreeNode {
  items: FieldInfo[];
  groups: Record<string, TreeNode>;
}

function groupByHierarchy(fields: FieldInfo[]): TreeNode {
  const root: TreeNode = { items: [], groups: {} };

  fields.forEach((field) => {
    if (!field.path) return; // Pula campos sem path

    // Normaliza arrays: "data[0].temp" -> "data[*].temp"
    const normalizedPath = field.path.replace(/\[\d+\]/g, '[*]');
    const parts = normalizedPath.split('.').filter(p => p);

    if (parts.length === 0) {
      root.items.push(field);
      return;
    }

    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.groups[part]) {
        current.groups[part] = { items: [], groups: {} };
      }
      current = current.groups[part];
    }

    current.items.push(field);
  });

  return root;
}

function countAllItems(node: TreeNode): number {
  let count = node.items.length;
  Object.values(node.groups).forEach((child) => {
    count += countAllItems(child);
  });
  return count;
}

// ════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
export default function FieldExplorer({
  data,
  selectedPaths,
  onTogglePath,
  title = 'Explorar Campos',
}: FieldExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['root'])
  );

  // Memoiza os campos achatados e agrupados
  const { fields, groupedFields } = useMemo(() => {
    if (!data) return { fields: [], groupedFields: null };
    const flat = flattenObject(data);
    return { fields: flat, groupedFields: groupByHierarchy(flat) };
  }, [data]);

  const filteredFields = useMemo(
    () =>
      fields.filter(
        (f) =>
          f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.path.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [fields, searchTerm]
  );

  const filteredGrouped = useMemo(
    () => (filteredFields.length > 0 ? groupByHierarchy(filteredFields) : null),
    [filteredFields]
  );

  function toggleGroup(path: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function expandAll(node: TreeNode, currentPath: string, toExpand: Set<string>) {
    toExpand.add(currentPath);
    Object.entries(node.groups).forEach(([name, child]) => {
      expandAll(child, currentPath === 'root' ? name : `${currentPath}.${name}`, toExpand);
    });
  }

  function collapseAll() {
    setExpandedGroups(new Set(['root']));
  }

  function expandAllHandler() {
    if (!filteredGrouped) return;
    const toExpand = new Set<string>();
    expandAll(filteredGrouped, 'root', toExpand);
    setExpandedGroups(toExpand);
  }

  // ════════════════════════════════════════════════════════
  //  RENDER RECURSIVO (com proteções contra null/undefined)
  // ════════════════════════════════════════════════════════
  function renderGroup(node: TreeNode | undefined, path: string, depth: number) {
    // Proteção principal contra o erro reportado
    if (!node) return null;

    const safeGroups = node.groups ?? {};
    const safeItems = node.items ?? [];
    const isExpanded = expandedGroups.has(path);
    const hasSubgroups = Object.keys(safeGroups).length > 0;

    return (
      <div key={path} style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {hasSubgroups && (
          <div
            className="flex items-center gap-2 p-2 hover:bg-bg-hover rounded cursor-pointer text-sm font-semibold text-text-bright"
            onClick={() => toggleGroup(path)}
          >
            <span className="text-text-dim text-xs w-4">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span>
              {path === 'root'
                ? '📦 Raiz'
                : `📁 ${path.replace('[*]', '[...]').split('.').pop()}`}
            </span>
            <span className="text-text-dim text-xs ml-auto">
              ({safeItems.length + countAllItems({ items: [], groups: safeGroups })}{' '}
              itens)
            </span>
          </div>
        )}

        {isExpanded && (
          <>
            {safeItems.map((field) => (
              <FieldItem
                key={field.path}
                field={field}
                isSelected={selectedPaths.has(field.path)}
                onToggle={() => onTogglePath(field.path)}
              />
            ))}

            {Object.entries(safeGroups).map(([name, subNode]) =>
              renderGroup(
                subNode,
                path === 'root' ? name : `${path}.${name}`,
                depth + 1
              )
            )}
          </>
        )}
      </div>
    );
  }

  function FieldItem({
    field,
    isSelected,
    onToggle,
  }: {
    field: FieldInfo;
    isSelected: boolean;
    onToggle: () => void;
  }) {
    return (
      <div
        className={`flex items-center gap-3 p-2.5 m-1 rounded-lg cursor-pointer transition-all border ${
          isSelected
            ? 'bg-accent/20 border-accent'
            : 'bg-bg-dark border-border hover:bg-bg-hover'
        }`}
        onClick={onToggle}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 accent-accent"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-bright truncate">
            {field.label}
          </div>
          <div className="text-xs text-text-dim font-mono truncate">
            {field.path}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] px-2 py-1 rounded font-mono uppercase ${
              field.dataType === 'number'
                ? 'bg-green/15 text-green'
                : field.dataType === 'string'
                ? 'bg-cyan/15 text-cyan'
                : field.dataType === 'boolean'
                ? 'bg-purple/15 text-purple'
                : field.dataType === 'array'
                ? 'bg-orange/15 text-orange'
                : 'bg-text-dim/15 text-text-dim'
            }`}
          >
            {field.dataType}
          </span>
          {field.unit && (
            <span className="text-xs text-text-dim font-mono">
              {field.unit}
            </span>
          )}
          {isSelected && <span className="text-accent font-bold">✓</span>}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  //  RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════
  if (!data) {
    return (
      <div className="text-center py-12 text-text-dim border-2 border-dashed border-border rounded-lg">
        <div className="text-4xl mb-3 opacity-30">🔍</div>
        <p>Nenhum dado para explorar</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-text-dim border-2 border-dashed border-border rounded-lg">
        <div className="text-4xl mb-3 opacity-30">📭</div>
        <p>Nenhum campo encontrado nesta estrutura</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-panel border border-border rounded-xl overflow-hidden">
      <div className="p-3 border-b border-border bg-bg-elevated space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-text-bright">{title}</h3>
          <div className="flex gap-1">
            <button
              className="btn-mini text-[10px]"
              onClick={expandAllHandler}
              title="Expandir tudo"
            >
              ️ Expandir
            </button>
            <button
              className="btn-mini text-[10px]"
              onClick={collapseAll}
              title="Recolher tudo"
            >
              ⬆️ Recolher
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="🔍 Buscar campo..."
          className="input-field text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="p-2 max-h-[400px] overflow-y-auto">
        {filteredFields.length === 0 ? (
          <div className="text-center py-8 text-text-dim text-sm">
            Nenhum campo encontrado para &quot;{searchTerm}&quot;
          </div>
        ) : (
          renderGroup(filteredGrouped || groupedFields || undefined, 'root', 0)
        )}
      </div>

      <div className="p-3 border-t border-border bg-bg-elevated text-xs text-text-dim flex justify-between">
        <span>
          {selectedPaths.size} selecionado(s) de {fields.length} campos
        </span>
        <span className="font-mono">
          {filteredFields.length} exibidos
        </span>
      </div>
    </div>
  );
}