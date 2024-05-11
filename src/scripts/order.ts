import { delay, fromEvent, map, concatMap } from "rxjs";
import productList from "../data/products.json";
import productStockList from "../data/productsStock.json";

type CardList = {
  [k: string]: number;
};

const shop = document.querySelector("#shop")!;
const errorLog = document.querySelector("#log")!;
const cartContainer = document.querySelector("#cartList")!;
const btnSubmit = document.querySelector("#submit")! as HTMLButtonElement;
const randomDelay = Math.round(Math.random() * 1500);
let cardList: CardList = {};

function showProducts() {
  productList.forEach((product) => {
    const element = document.createElement("div");
    element.innerHTML = `
          <div class="card-product">
          <span class="category">${product.category}</span>
          <figure>
            <img width="90px" height="90px"
              src="${product.image_url}" alt="${product.name}">
          </figure>
          <p>${product.name}</p>
          <span class="price">$ ${product.price}</span>
          <div class="counter">
            <button data-id="${product.id}" class="button button--secondary "> Agregar</button>
          </div>
        </div>
      `;
    shop?.appendChild(element);
  });
}

showProducts();

const submitObservable$ = fromEvent(btnSubmit, "click").pipe(
  delay(randomDelay),
  concatMap(() => submitOrderToApi())
);

const btnAddAmount = document.querySelectorAll("button[data-id]")!;

const observable$ = fromEvent(btnAddAmount, "click").pipe(
  delay(randomDelay),
  map((event) => (event.target as HTMLButtonElement).dataset.id),
  concatMap((productId) => checkStockFromApi(productId!)),
  concatMap(() => submitObservable$)
);
observable$.subscribe();

function addAmount(productId: string) {
  const newAmount =
    cardList[productId] !== undefined ? (cardList[productId] += 1) : 1;
  cardList[productId] = newAmount;
  updateCard();
}

function updateCard() {
  cartContainer.innerHTML = "";
  for (const productId in cardList) {
    const foundProduct = productById(productId, productList);
    const priceRow = document.createElement("div");
    priceRow.className = "price-row";
    priceRow.innerHTML = `
      <p>${foundProduct.name}</p>
      <p>Cantidad: ${cardList[productId]}</p>
    `;
    cartContainer.appendChild(priceRow);
    btnSubmit.disabled = false;
  }
}

function printOutStock(productId: string) {
  const msg = document.createElement("p");
  msg.style.color = "red";
  msg.style.fontSize = "0.8rem";
  const foundProduct = productById(productId, productList);
  msg.innerHTML = `Producto con ID ${foundProduct.name} fuera de stock`;
  errorLog.appendChild(msg);
}

function productById(productId: string, data: any) {
  return data.find((product: any) => product.id.toString() === productId);
}

function checkStockFromApi(productId: string) {
  return new Promise<void>((resolve) => {
    const foundProduct = productById(productId, productStockList);

    if (foundProduct?.stock! > 0) {
      addAmount(productId);
    } else {
      printOutStock(productId);
    }
    resolve();
  });
}

function submitOrderToApi() {
  return new Promise<void>((resolve) => {
    errorLog.innerHTML = `<p style="color: green;">Se completó la orden!</p>`;
    btnSubmit.disabled = true;
    cartContainer.innerHTML = "<p>No hay productos en el carrito</p>";
    cardList = {};
    resolve();
  });
}
