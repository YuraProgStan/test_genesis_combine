export const safeObjectParse = ( str: string, defaultValue = {}) => {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return defaultValue;
    }
}
