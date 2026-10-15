// Package httpx berisi helper respons JSON konsisten dan middleware HTTP.
package httpx

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ErrorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

type Meta struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data, "error": nil})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": data, "error": nil})
}

func OKMeta(c *gin.Context, data any, meta Meta) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data, "error": nil, "meta": meta})
}

func Fail(c *gin.Context, status int, code, msg string) {
	c.AbortWithStatusJSON(status, gin.H{"success": false, "data": nil, "error": ErrorBody{Code: code, Message: msg}})
}

func FailFields(c *gin.Context, msg string, fields map[string]string) {
	c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"success": false, "data": nil,
		"error": ErrorBody{Code: "VALIDATION_ERROR", Message: msg, Fields: fields}})
}

func BadRequest(c *gin.Context, msg string) { Fail(c, http.StatusBadRequest, "BAD_REQUEST", msg) }
func NotFound(c *gin.Context, msg string)   { Fail(c, http.StatusNotFound, "NOT_FOUND", msg) }
func Forbidden(c *gin.Context, msg string)  { Fail(c, http.StatusForbidden, "FORBIDDEN", msg) }
func Conflict(c *gin.Context, msg string)   { Fail(c, http.StatusConflict, "CONFLICT", msg) }
func Internal(c *gin.Context, err error) {
	_ = c.Error(err)
	Fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Terjadi kesalahan pada server. Silakan coba lagi.")
}

// Paging membaca ?page & ?per_page dengan batas aman.
func Paging(c *gin.Context) (page, perPage, offset int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ = strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}
	return page, perPage, (page - 1) * perPage
}

func NewMeta(page, perPage, total int) Meta {
	tp := (total + perPage - 1) / perPage
	if tp == 0 {
		tp = 1
	}
	return Meta{Page: page, PerPage: perPage, Total: total, TotalPages: tp}
}
