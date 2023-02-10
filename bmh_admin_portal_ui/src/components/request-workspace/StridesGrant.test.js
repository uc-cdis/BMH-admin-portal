import { shallow } from 'enzyme';
import StridesGrantForm from './strides-grant-form';
import * as apiUtils from '../../util/api';

/**
 * Major scenarios being tested in the suite
    * Form is being rendered with all the fields
    * Form having default values
    * Updating values in the form and make sure the updating part is happening as expected
    * Verify all the client side validations for the form are done correctly.
**/

const FIELD_COUNT=15;

const initialFormData = Object.freeze({
    scientific_poc: "",
    nih_funded_award_number: "",
    administering_nih_institute: "",
    program_officer_approval: "No",
    nih_program_official_name: "",
    nih_program_official_email: "",
    keywords: "",
    summary_and_justification: "",
    project_short_title: "",
    rcdc: "",
    additional_poc_email: "",
    additional_poc_job_title: ""
});

const updatedFormData = Object.freeze({
    scientific_poc: "test_poc",
    scientific_institution_domain_name: "Random Institute of Science",
    internal_poc_email: "test@email.com",
    confirm_internal_poc_email: "test@email.com",
    nih_funded_award_number: "1AAABB123456-CC",
    administering_nih_institute: "test_institute",
    program_officer_approval: "Yes",
    nih_program_official_name: "test_official_name",
    nih_program_official_email: "test@official.email",
    keywords: "test_keywords",
    summary_and_justification: "test_summary",
    project_short_title: "test_short_title",
    rcdc: "test_rcdc",
    additional_poc_email: "test_additional@poc.email",
    additional_poc_job_title: "test_additional_job_title"
});


const getFormData = stridesGrantWrapper => {
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
    let submitFunc = stridesGrantWrapper.prop('onSubmit');
    submitFunc({ currentTarget: { checkValidity: () => true }, preventDefault: () => null });
    return formDataFromState;
}

it('verifies form being rendered correctly', async () => {
    const stridesGrantWrapper = shallow(<StridesGrantForm />);
    expect(stridesGrantWrapper.find('FormControl')).toHaveLength(FIELD_COUNT);
});


it('verifies form renders with default values', async () => {
    const stridesGrantWrapper = shallow(<StridesGrantForm />);
    let formData = getFormData(stridesGrantWrapper);
    for(let key in initialFormData){
        expect(formData[key]).toBe(initialFormData[key]);
    }
});


it('verifies form fields being updated appropriately', async () => {
    const stridesGrantWrapper = shallow(<StridesGrantForm />);
    let input;

    for(let key in updatedFormData){
        input = stridesGrantWrapper.find('FormControl').filter({'name': key}).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', { target: { name: key, value: updatedFormData[key], setCustomValidity: () => {}}});
    }

    let formData = getFormData(stridesGrantWrapper);
    for(let key in updatedFormData){
        expect(formData[key]).toBe(updatedFormData[key]);
    }
});

describe('verifies form fields are being validated correctly', () => {

    it('validates email and confirm email', async () => {
        const stridesGrantWrapper = shallow(<StridesGrantForm />);
        let input;

        //Enter internal_poc_email to begin with
        input = stridesGrantWrapper.find('FormControl').filter({'name': 'internal_poc_email'}).filterWhere((n) => n.prop('onChange'));
        input.simulate('change', { target: { name: 'internal_poc_email', value: updatedFormData['internal_poc_email'], setCustomValidity: () => {}}});

        //Update the confirm_poc_email with the same email internal_poc_email
        input = stridesGrantWrapper.find('FormControl').filter({'name': 'confirm_internal_poc_email'}).filterWhere((n) => n.prop('onChange'));
        let custom_email_event = {
            target :{
                name : 'confirm_internal_poc_email',
                value : updatedFormData['internal_poc_email'], // same as the internal_poc_email
                setCustomValidity : (msg) => {}
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
        const stridesGrantWrapper = shallow(<StridesGrantForm />);
        let input;
        const fieldName = 'administering_nih_institute';

        //Update the administering_nih_institute with a non empty value
        input = stridesGrantWrapper.find('FormControl').filter({'name': fieldName}).filterWhere((n) => n.prop('onChange'));

        let custom_input_change_event = {
            target :{
                name : fieldName,
                value : updatedFormData[fieldName],
                setCustomValidity : (msg) => {}
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
        const stridesGrantWrapper = shallow(<StridesGrantForm />);
        let input;
        const fieldName = 'nih_funded_award_number';

        //Update the nih_funded_award_number with a regex confirming value
        input = stridesGrantWrapper.find('FormControl').filter({'name': fieldName}).filterWhere((n) => n.prop('onChange'));

        let custom_input_change_event = {
            target :{
                name : fieldName,
                value : updatedFormData[fieldName],
                setCustomValidity : (msg) => {}
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


it('submits the form and hits', () => {
    const stridesGrantWrapper = shallow(<StridesGrantForm />);
    const mockFunction = jest.spyOn(apiUtils, 'requestWorkspace');
    let submitFunc = stridesGrantWrapper.prop('onSubmit');

    //ensure request Workspace is called when the checkValidity returns true
    let custom_event_object = { currentTarget: { checkValidity: () => false }, preventDefault: () => null };
    submitFunc(custom_event_object);
    mockFunction.mockImplementation(()=>{});
    expect(mockFunction.mock.calls).toHaveLength(0);

    //ensure request Workspace is called when the checkValidity returns true
    custom_event_object.currentTarget.checkValidity = () => true;
    submitFunc(custom_event_object);
    expect(mockFunction).toHaveBeenCalled();
});
