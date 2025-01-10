import { Camera, Mic, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { Category } from '../types/categories';
import { Item } from '../types/item';

// Dynamically import the emoji picker to ensure it works well with SSR
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface AddItemFormProps {
  onAdd: (item: Omit<Item, 'id' | 'purchased'>, categoryId: number) => void;
  onAddCategory: (categoryName: string) => number;
  onClose: () => void;
  categories: Category[];
}

export default function AddItemForm({ onAdd, onAddCategory, onClose, categories }: AddItemFormProps) {
  const [item, setItem] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'new' | ''>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emojiObject: any) => {
    setEmoji(emojiObject.emoji); // Directly set the emoji as a string
    setShowEmojiPicker(false); // Close the emoji picker
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;

    try {
      await onAdd({ name: item, comment, photo }, categoryName, emoji);
      setItem('');
      setCategoryName('');
      setEmoji('');
      setComment('');
      setPhoto(null);
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

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
            {category.emoji} {category.name}
          </option>
        ))}
        <option value="new">+ קטגוריה חדשה</option>
      </select>
      {selectedCategoryId === 'new' && (
        <>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-300 focus:border-emerald-300 px-3 py-2 text-sm"
            placeholder="שם הקטגוריה"
            required
          />
          <div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="bg-gray-200 text-gray-600 p-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              בחר אימוג'י
            </button>
            {showEmojiPicker && (
              <div className="mt-2">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}
          </div>
          {emoji && (
            <div className="text-2xl mt-2">
              <span>נבחר אימוג'י: {emoji}</span>
            </div>
          )}
        </>
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
  );
}
