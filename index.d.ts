declare module '@Joel/valen' {
  export function upgrade(options: any): Promise<void>;
  
  // Declare types for someFunction and anotherFunction
  export function someFunction(/* add parameters */): /* add return type */;
  export function anotherFunction(/* add parameters */): /* add return type */;
  
  // Add declarations for other exported functions
}