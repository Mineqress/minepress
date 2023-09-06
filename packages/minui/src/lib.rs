use std::sync::Arc;

use tokio::{net::TcpStream, sync::Mutex};

#[macro_use]
extern crate napi_derive;

#[napi(js_name = "MinuiClient")]
pub struct JsMinuiClient {
    socket: Arc<TcpStream>
}
#[napi]
pub async fn connect(address: String) -> JsMinuiClient {
    let socket = TcpStream::connect(address).await.unwrap();
    JsMinuiClient {
        socket: Arc::new(socket)
    }
}