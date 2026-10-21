export const toNodeHandler = () => (req: any, res: any, next: any) => { next(); };
export const fromNodeHeaders = () => new Headers();
