import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
})
addFormats(ajv)

// Vite glob import of all schema JSON files
const schemaFiles = import.meta.glob('../../../schemas/**/*.json', { eager: true })

let initialized = false

export function initializeValidator() {
    if (initialized) return

    // Load all schemas into ajv
    // schemaFiles is an object with paths as keys and modules as values
    for (const path in schemaFiles) {
        const defaultExport = (schemaFiles[path] as any).default
        if (defaultExport && defaultExport.$id) {
            // Ajv might conflict if we add a schema that's already added, so try-catch
            try {
                if (!ajv.getSchema(defaultExport.$id)) {
                    ajv.addSchema(defaultExport)
                }
            } catch (e) {
                console.warn(`Failed to add schema from ${path}:`, e)
            }
        }
    }

    initialized = true
}

export function validateEntity(data: any) {
    if (!initialized) {
        initializeValidator()
    }

    // Find the bundle schema or determine the specific schema based on data type.
    // The bundle schema is at https://olympiad.local/schemas/bundles/olympiad-knowledge-system.schema.json
    const validate = ajv.getSchema('https://olympiad.local/schemas/bundles/olympiad-knowledge-system.schema.json')

    if (!validate) {
        throw new Error('Bundle schema not found in validator cache')
    }

    const valid = validate(data)
    return {
        valid,
        errors: validate.errors
    }
}
