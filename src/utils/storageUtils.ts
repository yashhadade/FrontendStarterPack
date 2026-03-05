
export function setStorageItem(key: string, value: string){
    localStorage.setItem(key, value);
}

export function getStorageItem(key: string){
    return localStorage.getItem(key);
}

export function removeStorageItem(){
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userId");   
    localStorage.removeItem("user");
}