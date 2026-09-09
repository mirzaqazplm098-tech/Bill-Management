import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Tag, 
  Layers, 
  CheckCircle2, 
  X,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { ProductItem, ProductModel, SaleRecord } from '../types';
import { formatCurrency } from '../lib/formatters';

interface ProductsManagementProps {
  products: ProductItem[];
  sales: SaleRecord[];
  onAddProduct: (product: ProductItem) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onSelectProductForSale?: (productName: string, modelName: string) => void;
}

export const ProductsManagement: React.FC<ProductsManagementProps> = ({
  products,
  sales,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food & Agro Processing');
  const [description, setDescription] = useState('');
  const [models, setModels] = useState<ProductModel[]>([
    { id: `mod-${Date.now()}-1`, name: 'Standard Edition', specs: '', standardPrice: 150000 }
  ]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        (p.description && p.description.toLowerCase().includes(lower)) ||
        p.models.some(m => m.name.toLowerCase().includes(lower) || (m.specs && m.specs.toLowerCase().includes(lower)))
      );
    });
  }, [products, selectedCategory, searchTerm]);

  // Product sales performance analytics
  const getProductStats = (productName: string) => {
    const productSales = sales.filter(s => s.product === productName);
    const totalUnits = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = productSales.reduce((sum, s) => sum + s.amount, 0);
    return { totalUnits, totalRevenue, orderCount: productSales.length };
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Food & Agro Processing');
    setDescription('');
    setModels([
      { id: `mod-${Date.now()}-1`, name: 'Model 10 KG / Hr', specs: 'Single Phase 3HP, 10-12 KG/hr', standardPrice: 185000 },
      { id: `mod-${Date.now()}-2`, name: 'Model 20 KG / Hr', specs: 'Three Phase 5.5HP, 20-25 KG/hr', standardPrice: 320000 },
    ]);
    setShowAddModal(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description || '');
    setModels(p.models.map(m => ({ ...m })));
    setShowAddModal(true);
  };

  const handleAddModelRow = () => {
    setModels([
      ...models,
      { id: `mod-${Date.now()}-${models.length + 1}`, name: '', specs: '', standardPrice: 100000 }
    ]);
  };

  const handleRemoveModelRow = (index: number) => {
    if (models.length === 1) return;
    setModels(models.filter((_, i) => i !== index));
  };

  const handleModelChange = (index: number, field: keyof ProductModel, value: any) => {
    const next = [...models];
    next[index] = { ...next[index], [field]: value };
    setModels(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || models.length === 0) return;

    if (editingProduct) {
      const updated: ProductItem = {
        ...editingProduct,
        name,
        category,
        description,
        models: models.filter(m => m.name.trim().length > 0),
      };
      onUpdateProduct(updated);
    } else {
      const newProd: ProductItem = {
        id: `prod-${Date.now()}`,
        name,
        category,
        description,
        models: models.filter(m => m.name.trim().length > 0),
      };
      onAddProduct(newProd);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Machinery & Product Catalog Models
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized engineering machinery catalog with capacity models, standard rates & specs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Product & Models</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search machinery, oil expellers, models..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Machinery' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stats = getProductStats(product.name);
          return (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {product.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      title="Edit Product and Models"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete product ${product.name}?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      title="Delete Product"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Models List */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Available Capacity Models ({product.models.length})</span>
                    <span>Standard Rate</span>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 max-h-40 overflow-y-auto">
                    {product.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-700/40 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{model.name}</span>
                          {model.specs && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{model.specs}</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(model.standardPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Mini-Stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <PackageCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sold: <strong>{stats.totalUnits} Units</strong></span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT PRODUCT & MODELS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>{editingProduct ? 'Edit Product & Capacity Models' : 'Add New Machinery & Models'}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Machinery / Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cold Press Oil Expeller"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Machinery Category
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Food & Agro Processing"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Product Overview & Technical Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Heavy duty engineering specifications, motor ratings, alloy screw treatments..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Models Repeater */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Capacity Models & Price Structure *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddModelRow}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Model</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                  {models.map((mod, index) => (
                    <div key={mod.id || index} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Model Name (e.g. 50 KG / Hr)"
                            value={mod.name}
                            onChange={(e) => handleModelChange(index, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white outline-none"
                          />
                          <input
                            type="number"
                            required
                            placeholder="Standard Price (PKR)"
                            value={mod.standardPrice}
                            onChange={(e) => handleModelChange(index, 'standardPrice', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white outline-none font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Technical Specs (e.g. Three Phase 10HP, Helical Gearbox)"
                          value={mod.specs || ''}
                          onChange={(e) => handleModelChange(index, 'specs', e.target.value)}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white outline-none text-[11px]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveModelRow(index)}
                        disabled={models.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
