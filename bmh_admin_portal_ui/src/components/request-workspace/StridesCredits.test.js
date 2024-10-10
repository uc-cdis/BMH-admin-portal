import {
    shallow
} from 'enzyme';
import StridesCreditForm from './strides-credits-form';
import * as apiUtils from '../../util/api';

/**
 * Major scenarios being tested in the suite
 * Form is being rendered with all the fields
 * Form having default values
 * Updating values in the form and make sure the updating part is happening as expected
 * Verify all the client side validations for the form are done correctly.
 **/
const FIELD_COUNT = 8;

const initialFormData = Object.freeze({
    scientific_poc: "",
    scientific_institution_domain_name: "",
    nih_funded_award_number: "",
    administering_nih_institute: "",
    intramural: false,
    summary_and_justification: "",
    project_short_title: "",
    attestation: false
});

const updatedFormData = Object.freeze({
    scientific_poc: "test_poc",
    scientific_institution_domain_name: "Random Institute of Science",
    internal_poc_email: "abc@example.nih.gov",
    confirm_internal_poc_email: "abc@example.nih.gov",
    nih_funded_award_number: "1AAABB123456-CC",
    administering_nih_institute: "test_institute",
    intramural: true,
    summary_and_justification: "test_summary",
    project_short_title: "test_short_title"
});


const getFormData = stridesCreditWrapper => {
    const mockFunction = jest.spyOn(apiUtils, 'requestWorkspace');
    let formDataFromState;

    /*****
    Implementing some IIFE + closure magic to fetch the value of formData
    from the scope of requestWorkspace
    *******/
    let iifeFunction = (() => {
        return (formData, _) => {
            formDataFromState = formData;
        }
    })();
    mockFunction.mockImplementation(iifeFunction);
    let submitFunc = stridesCreditWrapper.prop('onSubmit');
    submitFunc({
        currentTarget: {
            checkValidity: () => true
        },
        preventDefault: () => null
    });
    return formDataFromState;
}

it('verifies form being rendered correctly', async () => {
    const stridesCreditWrapper = shallow(<StridesCreditForm />);
    expect(stridesCreditWrapper.find('FormControl')).toHaveLength(FIELD_COUNT);
});

it('verifies form renders with default values', async () => {
    const stridesCreditWrapper = shallow(<StridesCreditForm />);
    let formData = getFormData(stridesCreditWrapper);
    for (let key in initialFormData) {
        expect(formData[key]).toBe(initialFormData[key]);
    }
});

it('verifies form fields being updated appropriately', async () => {
    const stridesCreditWrapper = shallow(<StridesCreditForm />);
    let input;

    for (let key in updatedFormData) {
        // Skipping intramural since it is not updated in the same way as other fields
        if (key === 'intramural') continue;

        input = stridesCreditWrapper.find('FormControl').filter({
            'name': key
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: key,
                value: updatedFormData[key],
                setCustomValidity: () => { }
            }
        });
    }

    //Updating value for intramural
    input = stridesCreditWrapper.find('FormCheck').filter({
        'name': 'intramural'
    }).filterWhere((n) => n.prop('onChange'));
    input.simulate('change', {
        target: {
            name: 'intramural',
            type: 'checkbox',
            checked: updatedFormData['intramural'],
            setCustomValidity: () => { }
        }
    });

    let formData = getFormData(stridesCreditWrapper);
    for (let key in updatedFormData) {
        expect(formData[key]).toBe(updatedFormData[key]);
    }
});

describe('verifies form fields are being validated correctly', () => {

    it('validates email mathces NIH regex', async () => {
        const stridesCreditWrapper = shallow(<StridesCreditForm />);
        let input;

        //Email validation makes sense only once a user checks the intramural field
        input = stridesCreditWrapper.find('FormCheck').filter({
            'name': 'intramural'
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: 'intramural',
                checked: true,
                type: "checkbox",
                setCustomValidity: () => { }
            }
        });

        //Enter internal_poc_email with a regex confirming value
        input = stridesCreditWrapper.find('FormControl').filter({
            'name': 'internal_poc_email'
        }).filterWhere((n) => n.prop('onChange'));

        let custom_email_event = {
            target: {
                name: 'internal_poc_email',
                value: updatedFormData['internal_poc_email'],
                setCustomValidity: (msg) => { }
            }
        }
        let mockedFunction = jest.spyOn(custom_email_event.target, "setCustomValidity");
        input.simulate('change', custom_email_event);
        expect(mockedFunction).toHaveBeenCalledWith("");

        //Enter internal_poc_email with a regex non-confirming value
        custom_email_event.target.value = 'random_different@email.address';
        input.simulate('change', custom_email_event);
        expect(mockedFunction).toHaveBeenCalledWith("Intramural user must their NIH email to request account");
    });

    it('validates email and confirm email', async () => {
        const stridesCreditWrapper = shallow(<StridesCreditForm />);
        let input;

        //Email validation makes sense once a user checks the intramural field
        input = stridesCreditWrapper.find('FormCheck').filter({
            'name': 'intramural'
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: 'intramural',
                checked: true,
                type: "checkbox",
                setCustomValidity: () => { }
            }
        });

        //Enter internal_poc_email with a regex confirming value
        input = stridesCreditWrapper.find('FormControl').filter({
            'name': 'internal_poc_email'
        }).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', {
            target: {
                name: 'internal_poc_email',
                value: updatedFormData['internal_poc_email'],
                setCustomValidity: () => { }
            }
        });

        //Enter confirm_internal_poc_email with a regex confirming value
        input = stridesCreditWrapper.find('FormControl').filter({
            'name': 'confirm_internal_poc_email'
        }).filterWhere((n) => n.prop('onChange'));

        let custom_email_event = {
            target: {
                name: 'confirm_internal_poc_email',
                value: updatedFormData['confirm_internal_poc_email'],
                setCustomValidity: (msg) => { }
            }
        }

        let mockedFunction = jest.spyOn(custom_email_event.target, "setCustomValidity");
        input.simulate('change', custom_email_event);
        expect(mockedFunction).toHaveBeenCalledWith("");

        // Update the confirm_poc_email with a mismatching email
        custom_email_event.target.value = 'random_different@email.address';
        input.simulate('change', custom_email_event);
        expect(mockedFunction).toHaveBeenCalledWith("Must match email");
    });

    it('validates NIH IoC', async () => {
        const stridesCreditWrapper = shallow(<StridesCreditForm />);
        let input;
        const fieldName = 'administering_nih_institute';

        //Update the administering_nih_institute with a non empty value
        input = stridesCreditWrapper.find('FormControl').filter({
            'name': fieldName
        }).filterWhere((n) => n.prop('onChange'));

        let custom_input_change_event = {
            target: {
                name: fieldName,
                value: updatedFormData[fieldName],
                setCustomValidity: (msg) => { }
            }
        }
        let mockedFunction = jest.spyOn(custom_input_change_event.target, "setCustomValidity");
        input.simulate('change', custom_input_change_event);
        expect(mockedFunction).toHaveBeenCalledWith("");

        // Update the administering_nih_institute with an empty value
        custom_input_change_event.target.value = '';
        input.simulate('change', custom_input_change_event);
        expect(mockedFunction).toHaveBeenCalledWith("Must select NIH IoC");

    });

    it('validates NIH grant number', async () => {
        const stridesCreditWrapper = shallow(<StridesCreditForm />);
        let input;
        const fieldName = 'nih_funded_award_number';

        //Update the nih_funded_award_number with a regex confirming value
        input = stridesCreditWrapper.find('FormControl').filter({
            'name': fieldName
        }).filterWhere((n) => n.prop('onChange'));

        let custom_input_change_event = {
            target: {
                name: fieldName,
                value: updatedFormData[fieldName],
                setCustomValidity: (msg) => { }
            }
        }
        let mockedFunction = jest.spyOn(custom_input_change_event.target, "setCustomValidity");
        input.simulate('change', custom_input_change_event);
        expect(mockedFunction).toHaveBeenCalledWith("");

        // Update the nih_funded_award_number with an empty value
        custom_input_change_event.target.value = '';
        input.simulate('change', custom_input_change_event);
        expect(mockedFunction).toHaveBeenCalledWith("Must match NIH grant number format");

        // Update the nih_funded_award_number with a value that doesn't match the format
        custom_input_change_event.target.value = 'NON-NIH-FORMAT-RANDOM-STRING';
        input.simulate('change', custom_input_change_event);
        expect(mockedFunction).toHaveBeenCalledWith("Must match NIH grant number format");
    });
});

it('submits the form and makes a call to requestWorkspace', () => {
    const stridesCreditWrapper = shallow(<StridesCreditForm />);
    const mockFunction = jest.spyOn(apiUtils, 'requestWorkspace');
    let submitFunc = stridesCreditWrapper.prop('onSubmit');

    //ensure request Workspace is called when the checkValidity returns true
    let custom_event_object = {
        currentTarget: {
            checkValidity: () => false
        },
        preventDefault: () => null
    };
    submitFunc(custom_event_object);
    expect(mockFunction.mock.calls).toHaveLength(0);

    //ensure request Workspace is called when the checkValidity returns true
    custom_event_object.currentTarget.checkValidity = () => true;
    submitFunc(custom_event_object);
    expect(mockFunction).toHaveBeenCalled();
});
