
```Go

// pkg/apierror/errors.go
type AppError struct {
    Codigo     string
    Mensaje    string
    HTTPStatus int
}

func (e *AppError) Error() string { return e.Mensaje }

var (
    ErrMotivoRequerido = &AppError{"MOTIVO_REQUERIDO", "El motivo es obligatorio", 400}
    ErrPedidoNoExiste  = &AppError{"PEDIDO_NO_ENCONTRADO", "El pedido no existe", 404}
)

// pkg/apiresponse/response.go
package apiresponse

import "time"

type Meta struct {
    Timestamp string `json:"timestamp"`
}

type ErrorDetail struct {
    Codigo  string `json:"codigo"`            // ej. "PEDIDO_NO_ENCONTRADO"
    Mensaje string `json:"mensaje"`
}

type Response struct {
    Exito   bool          `json:"exito"`
    Datos   any           `json:"datos,omitempty"`
    Errores []ErrorDetail `json:"errores,omitempty"` // 0, 1 o varios
    Meta    Meta          `json:"meta"`
}

func Ok(datos any) Response {
    return Response{Exito: true, Datos: datos, Meta: Meta{Timestamp: time.Now().UTC().Format(time.RFC3339)}}
}

func Error(errores ...ErrorDetail) Response {
    return Response{Exito: false, Errores: errores, Meta: Meta{Timestamp: time.Now().UTC().Format(time.RFC3339)}}
}

```
