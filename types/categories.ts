import { Item } from './item'

export const initialCategories = [
  { id: 1, name: '🧀 Dairy', items: [
    { id: 1, name: 'Milk', purchased: false, comment: '2% fat' },
    { id: 2, name: 'Cheese', purchased: false, comment: 'Cheddar' },
    { id: 3, name: 'Yogurt', purchased: false },
    { id: 4, name: 'Butter', purchased: false },
    { id: 5, name: 'Cream', purchased: false },
    { id: 6, name: 'Cottage Cheese', purchased: false, photo: '/placeholder.svg?height=400&width=400' },
    { id: 7, name: 'Sour Cream', purchased: false },
    { id: 8, name: 'Heavy Cream', purchased: false },
  ]},
  { id: 2, name: '🥕 Vegetables', items: [
    { id: 9, name: 'Spinach', purchased: false },
    { id: 10, name: 'Carrots', purchased: false },
    { id: 11, name: 'Tomatoes', purchased: false },
    { id: 12, name: 'Broccoli', purchased: false },
    { id: 13, name: 'Bell Peppers', purchased: false },
    { id: 14, name: 'Onions', purchased: false },
    { id: 15, name: 'Potatoes', purchased: false },
    { id: 16, name: 'Cucumber', purchased: false },
  ]},
  { id: 3, name: '🍎 Fruits', items: [
    { id: 17, name: 'Apples', purchased: false, comment: 'Granny Smith' },
    { id: 18, name: 'Bananas', purchased: false },
    { id: 19, name: 'Oranges', purchased: false },
    { id: 20, name: 'Strawberries', purchased: false },
    { id: 21, name: 'Blueberries', purchased: false },
    { id: 22, name: 'Grapes', purchased: false },
    { id: 23, name: 'Peaches', purchased: false },
  ]},
  { id: 4, name: '🍞 Bakery', items: [
    { id: 24, name: 'Bread', purchased: false },
    { id: 25, name: 'Bagels', purchased: false },
    { id: 26, name: 'Muffins', purchased: false },
    { id: 27, name: 'Croissants', purchased: false },
    { id: 28, name: 'Tortillas', purchased: false },
    { id: 29, name: 'Pita Bread', purchased: false },
  ]},
  { id: 5, name: '🥩 Meat', items: [
    { id: 30, name: 'Chicken', purchased: false },
    { id: 31, name: 'Ground Beef', purchased: false },
    { id: 32, name: 'Salmon', purchased: false },
    { id: 33, name: 'Pork Chops', purchased: false },
    { id: 34, name: 'Turkey', purchased: false },
    { id: 35, name: 'Bacon', purchased: false },
  ]},
  { id: 6, name: '🥫 Pantry', items: [
    { id: 36, name: 'Rice', purchased: false },
    { id: 37, name: 'Pasta', purchased: false },
    { id: 38, name: 'Canned Tomatoes', purchased: false },
    { id: 39, name: 'Beans', purchased: false },
    { id: 40, name: 'Cereal', purchased: false },
    { id: 41, name: 'Olive Oil', purchased: false },
  ]},
  { id: 7, name: '🧊 Frozen', items: [
    { id: 42, name: 'Ice Cream', purchased: false },
    { id: 43, name: 'Frozen Peas', purchased: false },
    { id: 44, name: 'Pizza', purchased: false },
    { id: 45, name: 'Mixed Vegetables', purchased: false },
    { id: 46, name: 'Fish Fillets', purchased: false },
  ]},
  { id: 8, name: '🥤 Beverages', items: [
    { id: 47, name: 'Coffee', purchased: false },
    { id: 48, name: 'Tea', purchased: false },
    { id: 49, name: 'Orange Juice', purchased: false },
    { id: 50, name: 'Soda', purchased: false },
    { id: 51, name: 'Water', purchased: false },
  ]},
  { id: 9, name: '🛒 Other', items: [] },
]

