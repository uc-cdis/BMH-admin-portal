import {
    shallow
} from 'enzyme';
import DirectPayForm from './direct-pay-form';
import * as apiUtils from '../../util/api';
import { render } from "@testing-library/react";

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
const SECOND_FORM_FIELD_COUNT = 8;

const firstFormData = Object.freeze({
    billingID: "",
    email: ""
});

const updatedFirstFormData = Object.freeze({
    billingID: "XXX12345",
    email: "tes", // assuming the email used here is test@test.com
});

const getBillingIDFormData = directPayWrapper => {
    const mockFunction = jest.spyOn(apiUtils, 'callExternalURL');
    let formDataFromState;

    /*****
    Implementing some IIFE + closure magic to fetch the value of formData
    from the scope of requestWorkspace
    *******/
    let iifeFunction = (() => {
        return (occHelpURL, method, headers, data, _) => {
            formDataFromState = {
                "billingID": data.queryStringParameters.brh_data.AGBillingID,
                "email": data.queryStringParameters.brh_data.Email
            }
        }
    })();
    mockFunction.mockImplementation(iifeFunction);
    let submitFunc = directPayWrapper.find('Form').prop('onSubmit');
    submitFunc({
        currentTarget: {
            checkValidity: () => true
        },
        preventDefault: () => null
    });
    return formDataFromState;
};

// Verify that both forms are rendered correctly
it('verifies direct pay billingID form being rendered correctly', async () => {
    const directPayBilllingIDWrapper = shallow( < DirectPayForm/> );
    expect(directPayBilllingIDWrapper.find('FormControl')).toHaveLength(FIRST_FORM_FIELD_COUNT);
});

// Verify that both forms are rendered with default values
it('verifies form renders with default values', async () => {
    const directPayBilllingIDWrapperforValues = shallow( < DirectPayForm/> );
    let formData = getBillingIDFormData(directPayBilllingIDWrapperforValues);
    for (let key in firstFormData) {
        expect(formData[key]).toBe(firstFormData[key]);
    }
});

// Verify that both forms are rendered with default values
it('verifies direct pay billingID form fields being updated appropriately', async () => {
    const directPayBilllingIDWrapper = shallow( < DirectPayForm/> );
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

it('submits the form and makes a call to callExternalURL', () => {
    const directPayWrapper = shallow(<DirectPayForm />);
    const mockFunction = jest.spyOn(apiUtils, 'callExternalURL');
    let submitFunc = directPayWrapper.find('Form').prop('onSubmit');

    //ensure request Workspace is called when the checkValidity returns true
    let custom_event_object = {
        currentTarget: {
            checkValidity: () => false
        },
        preventDefault: () => null
    };
    submitFunc(custom_event_object);
    expect(mockFunction.mock.calls).toHaveLength(1);

    //ensure request Workspace is called when the checkValidity returns true
    custom_event_object.currentTarget.checkValidity = () => true;
    submitFunc(custom_event_object);
    expect(mockFunction).toHaveBeenCalled();
});
