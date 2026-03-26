/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
    const { discount = 0, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - discount / 100);
    
}
   // @TODO: Расчет выручки от операции

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit || 0;

    let bonus = 0;
    if (index === 0) bonus = profit * 0.15; // 15% от прибыли для первого места
    else if (index === 1 || index === 2) bonus = profit * 0.10; // 10% от прибыли для второго и третьего места
    else if (index === 3) bonus = profit * 0.05; // 5% от прибыли для четвертого места

    return bonus;

    // Бонус для остальных продавцов
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    //Проверка входных данных
    if (!data) throw new Error("Отсутствуют данные для анализа");
    if (!Array.isArray(data.sellers)) throw new Error("Неверный формат данных: sellers должен быть массивом"); 
    if (!Array.isArray(data.products)) throw new Error("Неверный формат данных: products должен быть массивом");
    if (!Array.isArray(data.purchase_records)) throw new Error("Неверный формат данных: purchase_records должен быть массивом");
    if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
        throw new Error("Отсутствуют необходимые функции в опциях");
    }
    if (data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error("Входные данные не должны быть пустыми");
    }


    const { calculateRevenue, calculateBonus } = options;

    //Создание промежуточной структуры для сбора статистики по каждому продавцу
    const sellerStats = data.sellers.map(seller => ({
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            sales_count: 0,
            revenue: 0,
            profit: 0,
            product_sold: {}
    }));

    //Быстрый доступ к данным о продавцах по их ID
    const sellerIndex = Object.fromEntries(
        sellerStats.map((item) => [item.id, item])
    );

    
    //Быстрый доступ к данным о товарах по их sku
    const productIndex = Object.fromEntries(
        data.products.map(item => [item.sku, item])
    );

    //Обработка каждой покупки для накопления статистики по каждому продавцу

    data.purchase_records.forEach((record) => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count += 1;
        seller.revenue += record.total_amount;  //Суммирование выручки от каждой покупки    

        record.items.forEach((item) => {
            const product = productIndex[item.sku];  //Получение данных о товаре по его SKU
            const cost = product.purchase_price * item.quantity;  //Расчет выручки с помощью функции из опций
            const revenue = calculateRevenue(item, product); //Расчет прибыли от продажи товара
            const profit = revenue - cost;  //Расчет прибыли от продажи товара
            seller.profit += profit;  //Суммирование прибыли от каждой покупки

            //Учет количества проданных единиц для каждого товара
            if (!seller.product_sold[item.sku]) {
                seller.product_sold[item.sku] = 0;
            }
            seller.product_sold[item.sku] += item.quantity; //Суммирование количества проданных единиц для каждого товара
        }); 

        
    });

    //Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        //Назначение бонусов на основе ранжирования
        seller.bonus = calculateBonus(index, sellerStats.length, seller);

            //Определение топ-10 продуктов по количеству проданных единиц
        seller.top_products = Object.entries(seller.product_sold)
                .map(([sku, quantity]) => ({ sku, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);
    });

        return sellerStats.map(seller => ({
            seller_id: seller.id,
            name: seller.name,
            sales_count: seller.sales_count,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            bonus: +seller.bonus.toFixed(2),
            top_products: seller.top_products
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