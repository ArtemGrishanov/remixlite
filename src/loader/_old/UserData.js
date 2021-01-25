import { saveFormData } from './api'

class UserData {
    /**
     * @type {Array<{
     *  id: string,
     *  name: string,
     *  fields: Array<{
     *      id: string,
     *      name: string,
     *      fieldType: string,
     *      required: boolean
     *  }>
     * }>}
     */
    formTemplate = null

    /**
     * @param {{
     *  formId: string,
     *  formValues: Array<{
     *      fieldType: string,
     *      value: string
     *  }
     * }} formData
     */
    push(formData) {
        if (this.formTemplate === null) {
            console.error('UserData: formTemplate is not defined')

            return
        }

        formData.formId = this.formTemplate[0].id
        for (let i = 0; i < formData.formValues.length; i++) {
            const formValue = formData.formValues[i]

            let fieldType = void 0
            switch (formValue.fieldType) {
                case 'firstName':
                    fieldType = 'NAME'
                    break
                case 'lastName':
                    fieldType = 'LAST_NAME'
                    break
                case 'phone':
                    fieldType = 'PHONE'
                    break
                case 'email':
                    fieldType = 'EMAIL'
                    break
                default:
                    console.error('UserData: uncovered field type')
            }

            if (fieldType === void 0) {
                return
            }

            formValue.fieldType = fieldType

            for (let j = 0; j < this.formTemplate[0].fields.length; j++) {
                const field = this.formTemplate[0].fields[j]

                if (fieldType === field.fieldType) {
                    formValue.formFieldId = field.id
                }
            }
        }

        const { formId, formValues } = formData

        saveFormData({ formId, formValues })
    }
}

export default UserData
