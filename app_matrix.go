package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
)

// ListMatrixFiles は a.keysDir 内にある .xlsx ファイルの一覧を返します。
func (a *App) ListMatrixFiles() ([]string, error) {
	var xlsxFiles []string
	runtime.LogInfof(a.ctx, "Searching for .xlsx files in: %s", a.keysDir)

	entries, err := os.ReadDir(a.keysDir)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to read keys directory '%s': %v", a.keysDir, err)
		return nil, fmt.Errorf("failed to read directory '%s': %w", a.keysDir, err)
	}

	for _, entry := range entries {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".xlsx" {
			xlsxFiles = append(xlsxFiles, entry.Name())
		}
	}

	sort.Strings(xlsxFiles)
	runtime.LogInfof(a.ctx, "Found %d matrix .xlsx files.", len(xlsxFiles))
	return xlsxFiles, nil
}

// readSheetForMatrix は指定されたExcelファイルから特定のシートを読み込みます。
// ★デバッグログを追加
func readSheetForMatrix(f *excelize.File, sheetName string, ctx context.Context) ([][]string, error) {
	rows, err := f.GetRows(sheetName)
	if err != nil {
		runtime.LogWarningf(ctx, "Sheet '%s' not found, treating as empty.", sheetName)
		return [][]string{}, nil
	}
	// ★読み込んだ行数をログに出力する
	runtime.LogInfof(ctx, "  => Read %d rows from sheet '%s'.", len(rows), sheetName)
	return rows, nil
}

// LoadMatrix は指定されたExcelファイル名からマトリクスデータを読み込みます。
func (a *App) LoadMatrix(fileName string) (MatrixData, error) {
	var matrixData MatrixData
	filePath := filepath.Join(a.keysDir, fileName)
	runtime.LogInfof(a.ctx, "--- Loading matrix from Excel file: %s ---", filePath)

	f, err := excelize.OpenFile(filePath)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to open Excel file '%s': %v", filePath, err)
		return MatrixData{}, err
	}
	defer f.Close()

	matrixData.MatrixInfo, _ = readSheetForMatrix(f, "MatrixInfo", a.ctx)
	matrixData.TaxaInfo, _ = readSheetForMatrix(f, "TaxaInfo", a.ctx)
	matrixData.Traits, _ = readSheetForMatrix(f, "Traits", a.ctx)

	runtime.LogInfof(a.ctx, "--- Successfully loaded matrix from '%s'. ---", fileName)
	return matrixData, nil
}

// writeSheetForMatrix は [][]string データをExcelファイルのシートに書き込みます。
func writeSheetForMatrix(f *excelize.File, sheetName string, data [][]string) error {
	idx, _ := f.GetSheetIndex(sheetName)
	if idx != -1 {
		f.DeleteSheet(sheetName)
	}

	index, err := f.NewSheet(sheetName)
	if err != nil {
		return err
	}

	for r, rowData := range data {
		for c, cellData := range rowData {
			cell, _ := excelize.CoordinatesToCellName(c+1, r+1)
			f.SetCellValue(sheetName, cell, cellData)
		}
	}
	f.SetActiveSheet(index)
	return nil
}

// SaveMatrix は指定されたファイル名にマトリクスデータをExcelファイルとして保存します。
func (a *App) SaveMatrix(fileName string, matrixData MatrixData) error {
	filePath := filepath.Join(a.keysDir, fileName)
	runtime.LogInfof(a.ctx, "Saving matrix to Excel file: %s", filePath)

	f := excelize.NewFile()

	if err := writeSheetForMatrix(f, "MatrixInfo", matrixData.MatrixInfo); err != nil {
		return fmt.Errorf("failed to write MatrixInfo sheet: %w", err)
	}
	if err := writeSheetForMatrix(f, "TaxaInfo", matrixData.TaxaInfo); err != nil {
		return fmt.Errorf("failed to write TaxaInfo sheet: %w", err)
	}
	if err := writeSheetForMatrix(f, "Traits", matrixData.Traits); err != nil {
		return fmt.Errorf("failed to write Traits sheet: %w", err)
	}

	f.DeleteSheet("Sheet1")
	matrixInfoIndex, _ := f.GetSheetIndex("MatrixInfo")
	f.SetActiveSheet(matrixInfoIndex)

	if err := f.SaveAs(filePath); err != nil {
		runtime.LogErrorf(a.ctx, "Failed to save Excel file '%s': %v", filePath, err)
		return err
	}

	runtime.LogInfof(a.ctx, "Successfully saved matrix to '%s'.", fileName)
	return nil
}

// CreateNewMatrix は新しいマトリクス用の空のExcelファイルを作成します。
func (a *App) CreateNewMatrix(fileName string) error {
	if filepath.Ext(fileName) != ".xlsx" {
		fileName += ".xlsx"
	}

	filePath := filepath.Join(a.keysDir, fileName)
	runtime.LogInfof(a.ctx, "Creating new matrix Excel file at: %s", filePath)

	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		runtime.LogWarningf(a.ctx, "Attempted to create an existing matrix file: %s", filePath)
		return fmt.Errorf("file '%s' already exists", fileName)
	}

	emptyData := MatrixData{
		MatrixInfo: [][]string{{"key", "value"}},
		TaxaInfo:   [][]string{{"#TaxonID", "Name"}},
		Traits:     [][]string{{"#TraitID", "Name"}},
	}

	return a.SaveMatrix(fileName, emptyData)
}
