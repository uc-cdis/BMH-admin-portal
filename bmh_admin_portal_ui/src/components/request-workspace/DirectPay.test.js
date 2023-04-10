import {
    shallow
} from 'enzyme';
import DirectPayForm from './direct-pay-form';
import * as apiUtils from '../../util/api';

/**
 * We have two forms in this process
 * -- First Form is to confirm billing ID of user
 *    Form would take 8 character long Billing ID and first three characters of user email
 *    This form uses callExternalURL api method to make a call to direct pay api
 *
 * -- Second Form is user information form
 *    This form uses requestWorkspace api method to make a call to store data
 *
 * Major scenarios being tested in the suite
 * Both Forms is being rendered with all the fields
 * Both Forms having default values
 * Updating values in both forms and make sure the updating part is happening as expected
 * Verify all the client side validations for the forms are done correctly.
 **/

const occHelpURL = process.env.REACT_APP_OCC_HELPER_URL
const FIRST_FORM_FIELD_COUNT = 2;

const firstFormData = Object.freeze({
    billingID: "",
    email: "",
    attestation: false,
});

const updatedFirstFormData = Object.freeze({
    billingID: "XXX12345",
    email: "tes", // assuming the email used here is test@test.com
});

const getBillingIDFormData = directPayBilllingIDWrapper => {
    const mockFunction = jest.spyOn(apiUtils, 'callExternalURL');
    let formDataFromState;

    /*****
    Implementing some IIFE + closure magic to fetch the value of formData
    from the scope of callExternalURL
    *******/
    let iifeFunction = (() => {
        return (formData, _) => {
            console.log(formData)
            // formDataFromState = {
            //     "billingID" : billingID,
            //     "email" : email
            // };
        }
    })();
    mockFunction.mockImplementation(iifeFunction);
    let submitFunc = directPayBilllingIDWrapper.prop('onSubmit');
    submitFunc(
        occHelpURL,
        "post",
        {
            'Content-Type': 'text/plain'
        },
        {
        currentTarget: {
            checkValidity: () => true
        },
        preventDefault: () => null
    });
    return formDataFromState;
}


// Verify that both forms are rendered correctly
it('verifies direct pay billingID form being rendered correctly', async() => {
    const directPayBilllingIDWrapper = shallow( <DirectPayForm/> );
    expect(directPayBilllingIDWrapper.find('FormControl')).toHaveLength(FIRST_FORM_FIELD_COUNT);
});

// Verify that both forms are rendered with default values
it('verifies direct pay billingID form renders with default values', async() => {
    const directPayBilllingIDWrapper = shallow( <DirectPayForm/> );
    let formData = getBillingIDFormData(directPayBilllingIDWrapper);
    for (let key in firstFormData) {
        expect(formData[key]).toBe(firstFormData[key]);
    }
});


// Verify that both forms are rendered with default values
it('verifies direct pay billingID form fields being updated appropriately', async () => {
    const directPayBilllingIDWrapper = shallow( <DirectPayForm/> );
    let input;

    for (let key in updatedFirstFormData) {
        input = directPayBilllingIDWrapper.find('FormControl').filter({
            'name': key
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: key,
                value: updatedFirstFormData[key],
                setCustomValidity: () => {}
            }
        });
    }

    let formData = getBillingIDFormData(directPayBilllingIDWrapper);
    for (let key in updatedFirstFormData) {
        expect(formData[key]).toBe(updatedFirstFormData[key]);
    }
});


it('verifies direct pay details form fields being updated appropriately', async () => {
    const directPayWrapper = shallow( <DirectPayForm/> );
    let input;

    for (let key in updatedSecondFormData) {
        input = directPayWrapper.find('FormControl').filter({
            'name': key
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: key,
                value: updatedSecondFormData[key],
                setCustomValidity: () => {}
            }
        });
    }

    let formData = getFormData(directPayWrapper);
    for (let key in updatedSecondFormData) {
        expect(formData[key]).toBe(updatedSecondFormData[key]);
    }
});
