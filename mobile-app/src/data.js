// Mock data for the prototype
export const categories = [
    { id: 1, name: 'Роллы', icon: '🍣' },
    { id: 2, name: 'Суши', icon: '🍱' },
    { id: 3, name: 'Сеты', icon: '🎁' },
    { id: 4, name: 'Горячее', icon: '🍜' },
    { id: 5, name: 'Салаты', icon: '🥗' },
    { id: 6, name: 'Напитки', icon: '🥤' },
    { id: 7, name: 'Десерты', icon: '🍰' },
];

export const products = [
    {
        id: '1', name: 'Филадельфия Классик', description: 'Лосось, сливочный сыр, рис, нори',
        price: 289, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop',
        category_id: 1, is_hit: true, is_new: false, is_promo: false,
        options: [
            { id: '1a', name: 'Соевый соус', additional_price: 15 },
            { id: '1b', name: 'Имбирь', additional_price: 10 },
            { id: '1c', name: 'Васаби', additional_price: 10 },
        ],
    },
    {
        id: '2', name: 'Дракон Ролл', description: 'Угорь, авокадо, огурец, унаги соус',
        price: 349, image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop',
        category_id: 1, is_hit: false, is_new: true, is_promo: false,
        options: [],
    },
    {
        id: '3', name: 'Калифорния', description: 'Краб, авокадо, огурец, тобико',
        price: 259, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=400&fit=crop',
        category_id: 1, is_hit: false, is_new: false, is_promo: true,
        options: [],
    },
    {
        id: '4', name: 'Нигири лосось', description: 'Свежий лосось на рисе',
        price: 149, image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=400&fit=crop',
        category_id: 2, is_hit: true, is_new: false, is_promo: false,
        options: [],
    },
    {
        id: '5', name: 'Сет «Для двоих»', description: '24 шт: Филадельфия, Калифорния, Дракон',
        price: 699, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=400&fit=crop',
        category_id: 3, is_hit: false, is_new: false, is_promo: true,
        options: [],
    },
    {
        id: '6', name: 'Том Ям', description: 'Суп с морепродуктами, кокосовое молоко, лемонграсс',
        price: 219, image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&h=400&fit=crop',
        category_id: 4, is_hit: false, is_new: true, is_promo: false,
        options: [],
    },
    {
        id: '7', name: 'Эдамамэ', description: 'Бобы эдамамэ с морской солью',
        price: 129, image: 'https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=400&h=400&fit=crop',
        category_id: 5, is_hit: false, is_new: false, is_promo: false,
        options: [],
    },
    {
        id: '8', name: 'Матча Латте', description: 'Японский зелёный чай с молоком',
        price: 119, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=400&fit=crop',
        category_id: 6, is_hit: false, is_new: true, is_promo: false,
        options: [],
    },
];

export const banners = [
    { id: 1, title: 'Скидка 20% на сеты', subtitle: 'По промокоду SET20', gradient: 'linear-gradient(135deg, #FF5C00, #FF8A3D)' },
    { id: 2, title: 'Бесплатная доставка', subtitle: 'При заказе от 500₴', gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
    { id: 3, title: 'Новинки недели', subtitle: 'Попробуй первым!', gradient: 'linear-gradient(135deg, #059669, #10B981)' },
];

export const userPromocodes = [
    { code: 'WELCOME15', description: 'Скидка 15% на первый заказ', expires: '28.02.2026', discount: '15%' },
    { code: 'SET20', description: 'Скидка 20% на все сеты', expires: '15.03.2026', discount: '20%' },
    { code: 'FREE50', description: 'Скидка 50₴ на заказ', expires: '01.03.2026', discount: '50₴' },
];
