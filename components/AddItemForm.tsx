import { Camera, Mic, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Category } from '../types/categories';
import { Item } from '../types/item';

interface AddItemFormProps {
  onAdd: (item: Omit<Item, 'id' | 'purchased'>, categoryId: number) => void;
  onAddCategory: (categoryName: string) => number;
  onClose: () => void;
  categories: Category[];
}

export default function AddItemForm({ onAdd, onAddCategory, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('')
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'new' | ''>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let recognition: SpeechRecognition | null = null;

    if (isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setItem(prevItem => prevItem ? `${prevItem}, ${transcript}` : transcript);
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported');
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;

    const categoryName = selectedCategoryId === 'new' ? newCategoryName.trim() : '';

    try {
      await onAdd({ name: item, comment, photo }, categoryName);
      setItem('');
      setComment('');
      setPhoto(null);
      setSelectedCategoryId('');
      setNewCategoryName('');
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">מוצר חדש</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <input
        type="text"
        value={item}
        onChange={(e) => setItem(e.target.value)}
        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
        placeholder="שם המוצר"
        required
      />
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
        placeholder="הערה"
      />
      <select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
      >
        <option value="">קטגוריה</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
        <option value="new">+ קטגוריה חדשה</option>
      </select>
      {selectedCategoryId === 'new' && (
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
          placeholder="שם הקטגוריה"
          required
        />
      )}
      {photo && (
        <div className="flex items-center">
          <img src={photo} alt="Uploaded" className="w-10 h-10 object-cover rounded-md mr-2" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            הסר תמונה
          </button>
        </div>
      )}
      <div className="flex justify-between">
        <div className="space-x-2">
          <button
            type="button"
            onClick={() => setIsListening(true)}
            className={`p-2 rounded-md transition-colors duration-200 ${
              isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Mic size={20} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 text-gray-600 p-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            <Camera size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        <button
          type="submit"
          className="bg-[#FFB74D] hover:bg-[#FFA726] text-white px-4 py-2 rounded-xl transition-colors duration-200"
        >
          הוסף מוצר
        </button>
      </div>
    </form>
  )
}

