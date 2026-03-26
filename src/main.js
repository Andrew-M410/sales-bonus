/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { // Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - (discount / 100));
}



/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { // Расчет бонуса от позиции в рейтинге
    
    const { profit } = seller;

    let bonus = 0;
    if (index === 0) bonus = profit * 0.15; // 15% для продавца, который принёс наибольшую прибыль
    else if (index === 1 || index === 2) bonus = profit * 0.10; // 10% для продавцов, которые по прибыли находятся на втором и третьем месте
    else if (index === total - 1) return 0; // 0% для последнего продавца
    else bonus = profit * 0.05; // 5% для всех остальных продавцов, кроме самого последнего

    return bonus;
}



/**
 * Функция для анализа данных продаж
 * @param data исходные данные
 * @param options функции расчетов
 * @returns {{seller_id, name, revenue, profit, sales_count, top_products, bonus}[]}
 */
function analyzeSalesData(data, options) {

    //Проверка входящих данных
    if (!data) {
        throw new Error("Отсутствуют данные для анализа");
    }
    if (!Array.isArray(data.sellers)) {
        throw new Error("Неверный формат данных: sellers должен быть массивом");
    }
    if (!Array.isArray(data.products)) {
        throw new Error("Неверный формат данных: products должен быть массивом");
    }
    if (!Array.isArray(data.purchase_records)) {
        throw new Error("Неверный формат данных: purchase_records должен быть массивом");
    }
    if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
        throw new Error("Отсутствуют необходимые функции в опциях");
    }
    if (data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error("Входные данные не должны быть пустыми");
    }

    // Передаем функции для расчётов
    const { calculateRevenue, calculateBonus } = options;

    //Создание промежуточной структуры для сбора статистики по каждому продавцу
    const sellerStats = data.sellers.map(seller => ({
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            product_sold: {}
    }));

    //Быстрый доступ к данным о продавцах по их ID
    const sellerIndex = Object.fromEntries(
        sellerStats.map((item) => [item.id, item])
    );

    //Быстрый доступ к данным о товарах по их SKU
    const productIndex = Object.fromEntries(
        data.products.map(item => [item.sku, item])
    );

    // Двойной цикл перебора чеков и покупок в них
    data.purchase_records.forEach((record) => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1; // Увеличить количество продаж 
        seller.revenue += record.total_amount;  // Увеличить общую сумму выручки всех продаж   

        // Расчёт прибыли для каждого товара
        record.items.forEach((item) => { // Товар
            const product = productIndex[item.sku];  //Получение данных о товаре по его SKU через быстрый доступ
            const cost = product.purchase_price * item.quantity;  //Расчет выручки с помощью функции из опций
            const revenue = calculateRevenue(item, product); //Расчет прибыли от продажи товара
            const profit = revenue - cost;  //Расчет прибыли от продажи товара
            seller.profit += profit;  //Суммирование прибыли от каждой покупки

            //Учет количества проданных товаров
            if (!seller.product_sold[item.sku]) {
                seller.product_sold[item.sku] = 0;
            }
            seller.product_sold[item.sku] += item.quantity; // Увеличение по артикулу товара его проданное количество у продавца
        }); 
    });

    // Сортируем продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус

        seller.top_products = Object.entries(seller.product_sold) // Формируем топ-10 товаров
                .map(([sku, quantity]) => ({ sku, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);
    });

        return sellerStats.map(seller => ({
            seller_id: seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +seller.bonus.toFixed(2)
        }));
};

// @TODO: Проверка входных данных
// @TODO: Проверка наличия опций
// @TODO: Подготовка промежуточных данных для сбора статистики
// @TODO: Индексация продавцов и товаров для быстрого доступа
// @TODO: Расчет выручки и прибыли для каждого продавца
// @TODO: Сортировка продавцов по прибыли
// @TODO: Назначение премий на основе ранжирования
// @TODO: Подготовка итоговой коллекции с нужными полями