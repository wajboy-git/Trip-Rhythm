import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Printer, Package } from 'lucide-react';
import type { WeatherData } from '../types';
import { aggregatePackingList } from '../lib/weather';

interface PackingListSummaryProps {
  tripId: string;
  weatherData: WeatherData[];
}

export function PackingListSummary({ tripId, weatherData }: PackingListSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(`packing-list-${tripId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCheckedItems(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse stored packing list:', e);
      }
    }
  }, [tripId]);

  const handleToggleItem = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
    localStorage.setItem(`packing-list-${tripId}`, JSON.stringify([...newChecked]));
  };

  const handlePrint = () => {
    const packingList = aggregatePackingList(weatherData);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 30px;
              color: #111;
            }
            h2 {
              font-size: 18px;
              margin: 20px 0 10px;
              color: #333;
              border-bottom: 2px solid #ddd;
              padding-bottom: 5px;
            }
            ul {
              list-style: none;
              padding: 0;
            }
            li {
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            input[type="checkbox"] {
              margin-right: 10px;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Trip Packing List</h1>
          ${Object.entries(packingList).map(([category, items]) => `
            <h2>${category}</h2>
            <ul>
              ${items.map(item => `
                <li>
                  <input type="checkbox" id="${item}" />
                  <label for="${item}">${item}</label>
                </li>
              `).join('')}
            </ul>
          `).join('')}
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const packingList = aggregatePackingList(weatherData);
  const categories = Object.keys(packingList);
  const totalItems = Object.values(packingList).reduce((sum, items) => sum + items.length, 0);
  const checkedCount = checkedItems.size;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>

          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Packing List</h3>
            <p className="text-sm text-gray-600">
              {checkedCount} of {totalItems} items packed
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-6 space-y-6">
            {Object.entries(packingList).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                  <span>{category}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    {items.filter(item => checkedItems.has(item)).length}/{items.length}
                  </span>
                </h4>

                <div className="space-y-2">
                  {items.map((item) => (
                    <label
                      key={item}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.has(item)}
                        onChange={() => handleToggleItem(item)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span
                        className={`text-sm ${
                          checkedItems.has(item)
                            ? 'text-gray-400 line-through'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`}
                      >
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Packing List</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
