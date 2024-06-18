let animal = {
    eats: true
};
let rabbit = {
    jumps: true
};

rabbit.__proto__ = animal; // (*)

// теперь мы можем найти оба свойства в rabbit:
console.log( rabbit.eats );
const obj = { a:'text', n: 0}
const obj2 = {
    b: true
}
Object.setPrototypeOf(obj2, obj);

console.log(Object.getPrototypeOf(obj));
console.log(obj.__proto__);
console.log(Object.prototype.__proto__);
console.log(Object.getPrototypeOf(obj2));
console.log(obj2.a);
