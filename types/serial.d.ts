// types/serial.d.ts
interface SerialPort {
    readable: ReadableStream;
    writable: WritableStream;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
  }
  
  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
    bufferSize?: number;
    flowControl?: string;
  }
  
  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }
  
  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }
  
  interface Serial {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }
  
  // Extend the Navigator interface
  interface Navigator {
    serial: Serial;
  }